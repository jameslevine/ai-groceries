import { NextFunction, Request, Response } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { COGNITO } from '../constants';

const verifier = CognitoJwtVerifier.create({
  userPoolId: COGNITO.USER_POOL_ID,
  tokenUse: 'access',
  clientId: COGNITO.CLIENT_ID,
});

export const cognitoAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const payload = await verifier.verify(token);
    req.user = payload as any;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
