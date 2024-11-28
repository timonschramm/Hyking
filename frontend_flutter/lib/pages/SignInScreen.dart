import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_auth_ui/supabase_auth_ui.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

class SignInScreen extends StatelessWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sign In'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Email Sign In
            SupaEmailAuth(
              redirectTo: kIsWeb ? null : dotenv.get('SUPABASE_REDIRECT_URL'),
              onSignInComplete: (response) {
                Navigator.pushReplacementNamed(context, '/home');
              },
              onSignUpComplete: (response) {
                Navigator.pushReplacementNamed(context, '/home');
              },
              metadataFields: [
                MetaDataField(
                  prefixIcon: const Icon(Icons.person),
                  label: 'Username',
                  key: 'username',
                  validator: (val) {
                    if (val == null || val.isEmpty) {
                      return 'Please enter a username';
                    }
                    return null;
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),
            
            // Social Auth
            // SupaSocialsAuth(
            //   socialProviders: const [
            //     OAuthProvider.google,
            //     OAuthProvider.apple,
            //   ],
            //   colored: true,
            //   // ignore: unnecessary_string_interpolations
            //   redirectUrl: '${dotenv.get('SUPABASE_REDIRECT_URL')}',
            //   onSuccess: (response) {
            //     Navigator.pushReplacementNamed(context, '/home');
            //   },
            //   onError: (error) {
            //     ScaffoldMessenger.of(context).showSnackBar(
            //       SnackBar(content: Text(error.toString())),
            //     );
            //   },
            // ),
            
           
          ],
        ),
      ),
    );
  }
}
