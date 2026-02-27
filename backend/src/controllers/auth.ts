import { Request, Response } from 'express';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { COGNITO } from '../constants';
import { createDbUser } from '../adapters/users';

const cognito = new CognitoIdentityProviderClient({
  region: COGNITO.REGION,
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const command = new SignUpCommand({
      ClientId: COGNITO.CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
      ],
    });

    const result = await cognito.send(command);

    // Create user record in DynamoDB
    if (result.UserSub) {
      await createDbUser({
        userId: result.UserSub,
        email,
        firstName,
        lastName,
      });
    }

    res.status(201).json({
      message:
        'Registration successful. Please check your email for a verification code.',
      userId: result.UserSub,
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.name === 'UsernameExistsException') {
      return res
        .status(409)
        .json({ message: 'An account with this email already exists' });
    }
    if (error.name === 'InvalidPasswordException') {
      return res
        .status(400)
        .json({ message: 'Password does not meet requirements' });
    }

    res.status(500).json({ message: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const command = new InitiateAuthCommand({
      ClientId: COGNITO.CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const result = await cognito.send(command);

    if (!result.AuthenticationResult) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    res.json({
      accessToken: result.AuthenticationResult.AccessToken,
      refreshToken: result.AuthenticationResult.RefreshToken,
      idToken: result.AuthenticationResult.IdToken,
      expiresIn: result.AuthenticationResult.ExpiresIn,
      tokenType: 'Bearer',
    });
  } catch (error: any) {
    console.error('Login error:', error);

    if (error.name === 'NotAuthorizedException') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (error.name === 'UserNotConfirmedException') {
      return res
        .status(403)
        .json({ message: 'Please verify your email address first' });
    }
    if (error.name === 'UserNotFoundException') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(500).json({ message: 'Login failed' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const command = new ConfirmSignUpCommand({
      ClientId: COGNITO.CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    });

    await cognito.send(command);
    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error: any) {
    console.error('Verify error:', error);

    if (error.name === 'CodeMismatchException') {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    if (error.name === 'ExpiredCodeException') {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    res.status(500).json({ message: 'Verification failed' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const command = new ForgotPasswordCommand({
      ClientId: COGNITO.CLIENT_ID,
      Username: email,
    });

    await cognito.send(command);
    // Always return 200 to prevent email enumeration
    res.json({
      message:
        'If an account exists with this email, a reset code has been sent.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    // Always return 200 to prevent email enumeration
    res.json({
      message:
        'If an account exists with this email, a reset code has been sent.',
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    const command = new ConfirmForgotPasswordCommand({
      ClientId: COGNITO.CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });

    await cognito.send(command);
    res.json({
      message:
        'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);

    if (error.name === 'CodeMismatchException') {
      return res.status(400).json({ message: 'Invalid reset code' });
    }
    if (error.name === 'ExpiredCodeException') {
      return res.status(400).json({ message: 'Reset code has expired' });
    }

    res.status(500).json({ message: 'Password reset failed' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    const command = new InitiateAuthCommand({
      ClientId: COGNITO.CLIENT_ID,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const result = await cognito.send(command);

    if (!result.AuthenticationResult) {
      return res.status(401).json({ message: 'Token refresh failed' });
    }

    res.json({
      accessToken: result.AuthenticationResult.AccessToken,
      idToken: result.AuthenticationResult.IdToken,
      expiresIn: result.AuthenticationResult.ExpiresIn,
      tokenType: 'Bearer',
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};
