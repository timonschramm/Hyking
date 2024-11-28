import 'package:flutter/material.dart';

class ResultsScreen extends StatelessWidget {
  final String transcription;

  const ResultsScreen({super.key, required this.transcription});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Results'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Text(
          transcription,
          style: const TextStyle(fontSize: 18),
        ),
      ),
    );
  }
}