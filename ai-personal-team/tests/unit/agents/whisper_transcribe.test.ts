import { transcribeAudio } from '../../../agents/whisper_transcribe';

// Mock OpenAI client
jest.mock('openai', () => {
  const mockCreateTranscription = jest.fn().mockResolvedValue({ text: 'Mocked transcription text' });
  
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      audio: {
        transcriptions: {
          create: mockCreateTranscription
        }
      }
    }))
  };
});

describe('whisper_transcribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call OpenAI with correct parameters', async () => {
    // Create a mock audio blob
    const mockAudioData = new Blob(['mock audio data'], { type: 'audio/mp3' });
    
    // Get the mocked OpenAI instance
    const openaiMock = require('openai');
    const createTranscriptionMock = openaiMock.OpenAI.mock.results[0]?.value.audio.transcriptions.create;
    
    // Call the function we're testing
    const result = await transcribeAudio(mockAudioData);
    
    // Assert OpenAI was called with correct parameters
    expect(createTranscriptionMock).toHaveBeenCalled();
    expect(result).toBe('Mocked transcription text');
  });
  
  it('should include language parameter when provided', async () => {
    // Create a mock audio blob
    const mockAudioData = new Blob(['mock audio data'], { type: 'audio/mp3' });
    
    // Get the mocked OpenAI instance
    const openaiMock = require('openai');
    const createTranscriptionMock = openaiMock.OpenAI.mock.results[0]?.value.audio.transcriptions.create;
    
    // Call the function with specific language
    await transcribeAudio(mockAudioData, { language: 'es-AR' });
    
    // Assert language parameter was passed
    expect(createTranscriptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'es-AR'
      })
    );
  });
  
  it('should handle file name parameter when provided', async () => {
    // Create a mock audio blob
    const mockAudioData = new Blob(['mock audio data'], { type: 'audio/mp3' });
    
    // Get the mocked OpenAI instance
    const openaiMock = require('openai');
    const createTranscriptionMock = openaiMock.OpenAI.mock.results[0]?.value.audio.transcriptions.create;
    
    // Call the function with a filename
    await transcribeAudio(mockAudioData, { fileName: 'test-recording.mp3' });
    
    // The filename should affect the form data creation
    expect(createTranscriptionMock).toHaveBeenCalled();
  });
  
  it('should throw an error when API call fails', async () => {
    // Create a mock audio blob
    const mockAudioData = new Blob(['mock audio data'], { type: 'audio/mp3' });
    
    // Get the mocked OpenAI instance and make it reject
    const openaiMock = require('openai');
    const mockError = new Error('API Error');
    openaiMock.OpenAI.mock.results[0].value.audio.transcriptions.create.mockRejectedValueOnce(mockError);
    
    // Expect the function to throw
    await expect(transcribeAudio(mockAudioData)).rejects.toThrow('API Error');
  });
});
