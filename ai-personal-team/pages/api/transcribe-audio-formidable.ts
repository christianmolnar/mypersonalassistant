import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { transcribeAudio } from '../../agents/whisper_transcribe';

// Disable the default body parser to handle form data with files
export const config = {
  api: {
    bodyParser: false,
  },
};

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
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Configure formidable v2 style
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB max
    });

    // Parse the form data using callback style for v2
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("Form parsing error:", err);
          reject(err);
        } else {
          console.log("Form parsed successfully:", { 
            fieldKeys: Object.keys(fields),
            fileKeys: Object.keys(files)
          });
          resolve([fields, files]);
        }
      });
    });
    
    // Check if we got any files at all
    console.log("Files received:", Object.keys(files));
    
    // Get the file info - check audio field exists
    if (!files.audio) {
      console.error("No audio field found. Available fields:", Object.keys(files));
      return res.status(400).json({ 
        error: 'No audio file found in request under "audio" field',
        availableFields: Object.keys(files)
      });
    }

    // Handle both single file and array cases
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    console.log("API route: Audio file received and saved", {
      path: audioFile.filepath || audioFile.path,
      size: audioFile.size,
      type: audioFile.mimetype || audioFile.type,
      originalFilename: audioFile.originalFilename || audioFile.name
    });

    // Get the file path (different property names in different versions)
    const filePath = audioFile.filepath || audioFile.path;
    const fileSize = audioFile.size;
    const mimeType = audioFile.mimetype || audioFile.type || 'audio/mp3';
    const originalName = audioFile.originalFilename || audioFile.name;

    // Verify the file exists and has content
    try {
      const stats = fs.statSync(filePath);
      console.log("File stats:", {
        size: stats.size,
        isFile: stats.isFile(),
        created: stats.birthtime
      });
      
      if (stats.size === 0) {
        return res.status(400).json({ error: 'Audio file is empty (0 bytes)' });
      }

      // Minimum size check for audio files
      if (stats.size < 100) {
        console.warn(`Audio file very small: ${stats.size} bytes`);
      }
    } catch (statError) {
      console.error("Error checking file stats:", statError);
      return res.status(500).json({ error: 'Could not access the uploaded file' });
    }

    // Read the file into a buffer
    let fileBuffer;
    try {
      fileBuffer = fs.readFileSync(filePath);
      console.log(`Successfully read file buffer, size: ${fileBuffer.length} bytes`);
    } catch (readError) {
      console.error("Error reading file:", readError);
      return res.status(500).json({ error: 'Error reading uploaded audio file' });
    }
    
    // Create a blob with appropriate MIME type
    const fileBlob = new Blob([fileBuffer], { type: mimeType });
    console.log(`Created blob with size: ${fileBlob.size} bytes and type: ${fileBlob.type}`);
    
    // Ensure the file has a proper name with .mp3 extension for the API
    const fileName = originalName || path.basename(filePath);
    
    console.log("API route: Sending to Whisper API with filename:", fileName);

    // Send the file to Whisper API
    try {
      console.log("Calling transcribeAudio with:", {
        language: 'es',
        model: 'whisper-1',
        fileName,
        fileSize: fileBlob.size
      });
      
      const transcriptionResult = await transcribeAudio(fileBlob, {
        language: 'es',
        model: 'whisper-1',
        fileName: fileName
      });
      
      console.log("API route: Transcription successful:", transcriptionResult);
      
      // Clean up: Delete the temporary file
      try {
        fs.unlinkSync(filePath);
        console.log("Temporary file cleaned up");
      } catch (unlinkErr) {
        console.warn("Could not delete temporary file:", unlinkErr);
      }
      
      // Return the transcription
      return res.status(200).json(transcriptionResult);
    } catch (transcriptionError) {
      console.error("Transcription API error:", transcriptionError);
      return res.status(500).json({ 
        error: 'Error calling Whisper API', 
        details: transcriptionError instanceof Error ? transcriptionError.message : String(transcriptionError)
      });
    }
  } catch (error: unknown) {
    console.error('API route: Error transcribing audio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return res.status(500).json({ 
      error: 'Error processing audio file', 
      details: errorMessage 
    });
  }
}
