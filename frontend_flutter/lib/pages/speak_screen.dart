import 'package:flutter/material.dart';
import 'package:audio_waveforms/audio_waveforms.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
// ignore: depend_on_referenced_packages
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'results_screen.dart';

class SpeakScreen extends StatefulWidget {
  const SpeakScreen({super.key});

  @override
  SpeakScreenState createState() => SpeakScreenState();
}

class SpeakScreenState extends State<SpeakScreen> {
  final RecorderController _recorderController = RecorderController();
  bool _isRecording = false;
  String _transcription = '';
  final TextEditingController _textController = TextEditingController();

  @override
  void dispose() {
    _recorderController.dispose();
    _textController.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    try {
      // Get the temporary directory
      Directory tempDir = await getTemporaryDirectory();
      String filePath = '${tempDir.path}/audio_${DateTime.now().millisecondsSinceEpoch}.m4a';

      await _recorderController.record(path: filePath);
      setState(() {
        _isRecording = true;
      });
    } catch (e) {
      print('Error starting recording: $e');
    }
  }

  Future<void> _stopRecording() async {
    try {
      String? path = await _recorderController.stop();
      setState(() {
        _isRecording = false;
      });
      if (path != null) {
        await _transcribeAudio(path);
      }
    } catch (e) {
      print('Error stopping recording: $e');
    }
  }

  Future<void> _transcribeAudio(String filePath) async {
    final uri = Uri.parse('https://api.openai.com/v1/audio/transcriptions');
    final request = http.MultipartRequest('POST', uri)
      ..headers['Authorization'] = 'Bearer ${dotenv.get('OPENAI_API_KEY')}'
      ..files.add(await http.MultipartFile.fromPath('file', filePath))
      ..fields['model'] = 'whisper-1'
      ..fields['response_format'] = 'json';

    try {
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _transcription = data['text'];
        });
      } else {
        print('Transcription failed: ${response.statusCode} ${response.body}');
      }
    } catch (e) {
      print('Error during transcription: $e');
    }
  }

  void _navigateToResults() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ResultsScreen(transcription: _transcription),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Speak'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Audio Waveform Widget
            AudioWaveforms(
              size: Size(MediaQuery.of(context).size.width, 100.0),
              recorderController: _recorderController,
              waveStyle: const WaveStyle(
                waveColor: Colors.blue,
                extendWaveform: true,
                showMiddleLine: false,
              ),
            ),
            const SizedBox(height: 20),
            // Recording Controls
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: _isRecording ? _stopRecording : _startRecording,
                  child: Text(_isRecording ? 'Stop Recording' : 'Start Recording'),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // OR Divider
            Row(
              children: [
                Expanded(child: Divider()),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8.0),
                  child: Text('OR'),
                ),
                Expanded(child: Divider()),
              ],
            ),
            const SizedBox(height: 20),
            // Text Input
            TextField(
              controller: _textController,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: 'Type your text here',
              ),
            ),
            const SizedBox(height: 20),
            // Submit Button
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _transcription = _textController.text;
                });
              },
              child: const Text('Submit Text'),
            ),
            const SizedBox(height: 20),
            // Display Transcription
            Expanded(
              child: SingleChildScrollView(
                child: Text(
                  _transcription.isNotEmpty ? _transcription : 'Transcription will appear here.',
                  style: const TextStyle(fontSize: 16),
                ),
              ),
            ),
            // Navigate Button
            ElevatedButton(
              onPressed: _transcription.isNotEmpty ? _navigateToResults : null,
              child: const Text('Go to Results'),
            ),
          ],
        ),
      ),
    );
  }
} 