import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:frontend/pages/speak_screen.dart';
import 'package:supabase_auth_ui/supabase_auth_ui.dart';
import 'pages/SignInScreen.dart';
import 'pages/ResetPasswordScreen.dart';
import 'pages/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await dotenv.load(fileName: ".env.local");
  
  await Supabase.initialize(
    url: dotenv.get('SUPABASE_URL'),
    anonKey: dotenv.get('SUPABASE_ANON_KEY'),
  );
  
  runApp(const MyApp());
}

final supabase = Supabase.instance.client;

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Supabase Auth Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      initialRoute: supabase.auth.currentUser != null ? '/home' : '/signin',
      routes: {
        '/signin': (context) => const SignInScreen(),
        '/reset-password': (context) => const ResetPasswordScreen(),
        '/home': (context) => const SpeakScreen(),
      },
    );
  }
}