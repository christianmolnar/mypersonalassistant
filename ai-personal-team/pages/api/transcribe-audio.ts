import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingMessage } from 'http';
import fs from 'fs';
import path from 'path';
import { transcribeAudio } from '../../agents/whisper_transcribe';

// Disable the default body parser to handle form data with files
export const config = {
  api: {
    bodyParser: false,
  },
};

// Simple multipart parser for audio files
function parseMultipartFormData(req: IncomingMessage): Promise<{ fields: any, files: any }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const contentType = req.headers['content-type'] || '';
    
    // Check if it's multipart/form-data
    if (!contentType.includes('multipart/form-data')) {
      return reject(new Error(`Unsupported content type: ${contentType}`));
    }
    
    // Extract boundary
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) {
      return reject(new Error('No boundary found in multipart data'));
    }
    
    const boundary = '--' + boundaryMatch[1];
    
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const parts = buffer.toString('binary').split(boundary);
        
        const files: any = {};
        const fields: any = {};
        
        for (const part of parts) {
          if (part.includes('Content-Disposition')) {
            const headerEndIndex = part.indexOf('\r\n\r\n');
            if (headerEndIndex === -1) continue;
            
            const headers = part.substring(0, headerEndIndex);
            const content = part.substring(headerEndIndex + 4);
            
            // Extract field name
            const nameMatch = headers.match(/name="([^"]+)"/);
            if (!nameMatch) continue;
            
            const fieldName = nameMatch[1];
            
            // Check if it's a file
            if (headers.includes('filename=')) {
              const filenameMatch = headers.match(/filename="([^"]*)"/);
              const filename = filenameMatch ? filenameMatch[1] : 'unknown';
              
              const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/);
              const fileContentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';
              
              // Remove the trailing boundary marker
              const fileData = content.replace(/\r\n$/, '');
              const binaryData = Buffer.from(fileData, 'binary');
              
              // Save to temporary file
              const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
              }
              
              const tempFileName = `upload-${Date.now()}-${filename}`;
              const tempFilePath = path.join(uploadsDir, tempFileName);
              fs.writeFileSync(tempFilePath, binaryData);
              
              files[fieldName] = {
                path: tempFilePath,
                originalFilename: filename,
                size: binaryData.length,
                headers: { 'content-type': fileContentType }
              };
            } else {
              // It's a regular field
              fields[fieldName] = content.replace(/\r\n$/, '');
            }
          }
        }
        
        resolve({ fields, files });
      } catch (error) {
        reject(error);
      }
    });
    
    req.on('error', (error) => {
      reject(error);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("API route: Received audio transcription request");
    console.log("Request headers:", {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    });
    
    // Parse the multipart form data
    const { fields, files } = await parseMultipartFormData(req);
    
    console.log("Form parsed successfully:", { 
      fieldKeys: Object.keys(fields),
      fileKeys: Object.keys(files)
    });
    
    // Get the file info - check audio field exists
    if (!files.audio) {
      console.error("No audio field found. Available fields:", Object.keys(files));
      return res.status(400).json({ 
        error: 'No audio file found in request under "audio" field',
        availableFields: Object.keys(files)
      });
    }

    const audioFile = files.audio;
    
    console.log("API route: Audio file received and saved", {
      path: audioFile.path,
      size: audioFile.size,
      type: audioFile.headers['content-type'],
      originalFilename: audioFile.originalFilename
    });

    // Verify the file exists and has content
    try {
      const stats = fs.statSync(audioFile.path);
      console.log("File stats:", {
        size: stats.size,
        isFile: stats.isFile(),
      });
      
      if (stats.size === 0) {
        return res.status(400).json({ error: 'Audio file is empty (0 bytes)' });
      }
    } catch (statError) {
      console.error("Error checking file stats:", statError);
      return res.status(500).json({ error: 'Could not access the uploaded file' });
    }

    // Read the file into a buffer
    const fileBuffer = fs.readFileSync(audioFile.path);
    console.log(`Successfully read file buffer, size: ${fileBuffer.length} bytes`);
    
    // Create a blob with appropriate MIME type
    const mimeType = audioFile.headers['content-type'] || 'audio/mp3';
    const fileBlob = new Blob([fileBuffer], { type: mimeType });
    console.log(`Created blob with size: ${fileBlob.size} bytes and type: ${fileBlob.type}`);
    
    // Ensure the file has a proper name
    const fileName = audioFile.originalFilename || `recording-${Date.now()}.mp3`;
    
    console.log("API route: Sending to Whisper API with filename:", fileName);

    // Send the file to Whisper API
    const transcriptionResult = await transcribeAudio(fileBlob, {
      language: 'es',
      model: 'whisper-1',
      fileName: fileName
    });
    
    console.log("API route: Transcription successful:", transcriptionResult);
    
    // Clean up: Delete the temporary file
    try {
      fs.unlinkSync(audioFile.path);
      console.log("Temporary file cleaned up");
    } catch (unlinkErr) {
      console.warn("Could not delete temporary file:", unlinkErr);
    }
    
    // Return the transcription
    return res.status(200).json(transcriptionResult);
    
  } catch (error: unknown) {
    console.error('API route: Error transcribing audio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return res.status(500).json({ 
      error: 'Error processing audio file', 
      details: errorMessage 
    });
  }
}
