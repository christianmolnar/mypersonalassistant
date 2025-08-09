import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { transcribeAudio } from '../../agents/whisper_transcribe';

// Ensure environment variables are loaded
require('dotenv').config({ path: '.env.local' });

// Type definitions for formidable to make TypeScript happy
interface FormidableFile {
  filepath: string;
  originalFilename: string | null;
  mimetype: string | null;
  size: number;
  newFilename?: string;
}

interface FormidableFiles {
  [key: string]: FormidableFile | FormidableFile[];
}

type FormidableFields = {
  [key: string]: string | string[];
};

// Disable the default body parser to handle form data with files
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("API route: Transcribe audio called");
  console.log("Environment check - OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
  console.log("Environment check - OPENAI_API_KEY prefix:", process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'not found');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("API route: Received audio transcription request");
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }    // Configure formidable to save files to disk with more permissive options
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFiles: 1,
      allowEmptyFiles: true, // Allow empty files initially to avoid rejection
      minFileSize: 0, // Don't reject small files
      multiples: false, // We only need one file
      filename: (_name: string, _ext: string, _part: any) => {
        // Always use mp3 extension for Whisper API compatibility
        return `recording-${Date.now()}.mp3`;
      },
    });

    // Log the full request headers for debugging
    console.log("Request content type:", req.headers['content-type']);

    // Parse the form data
    const [fields, files] = await new Promise<[FormidableFields, FormidableFiles]>((resolve, reject) => {
      form.parse(req, (err: Error | null, fields: FormidableFields, files: FormidableFiles) => {
        if (err) {
          console.error("Form parsing error:", err);
          reject(err);
        } else {
          console.log("Form parsed successfully:", { 
            fields: Object.keys(fields),
            files: Object.keys(files)
          });
          resolve([fields, files]);
        }
      });
    });    // Check if we got any files at all
    console.log("Files received:", JSON.stringify(files, null, 2));
    
    // Get the file info - check audio field exists
    if (!files.audio) {
      return res.status(400).json({ error: 'No audio file found in request under "audio" field' });
    }

    // Handle both single file and array cases
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    console.log("API route: Audio file received and saved", {
      path: audioFile.filepath,
      size: audioFile.size,
      type: audioFile.mimetype,
      originalFilename: audioFile.originalFilename
    });

    // Verify the file exists and has content
    try {
      const stats = fs.statSync(audioFile.filepath);
      console.log("File stats:", {
        size: stats.size,
        isFile: stats.isFile(),
        created: stats.birthtime
      });
      
      if (stats.size === 0) {
        return res.status(400).json({ error: 'Audio file is empty (0 bytes)' });
      }
    } catch (statError) {
      console.error("Error checking file stats:", statError);
      return res.status(500).json({ error: 'Could not access the uploaded file' });
    }

    // Read the file into a buffer
    let fileBuffer;
    try {
      fileBuffer = fs.readFileSync(audioFile.filepath);
      console.log(`Successfully read file buffer, size: ${fileBuffer.length} bytes`);
    } catch (readError) {
      console.error("Error reading file:", readError);
      return res.status(500).json({ error: 'Error reading uploaded audio file' });
    }
    
    // Create a blob with audio/mp3 MIME type
    const fileBlob = new Blob([fileBuffer], { type: 'audio/mp3' });
    console.log(`Created blob with size: ${fileBlob.size} bytes and type: ${fileBlob.type}`);
    
    // Ensure the file has a proper name with .mp3 extension for the API
    const fileName = path.basename(audioFile.filepath);
    
    console.log("API route: Sending to Whisper API with filename:", fileName);    // Send the file to Whisper API
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
        fs.unlinkSync(audioFile.filepath);
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
