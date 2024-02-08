import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios'
import { jwtConstants } from './constants';
import * as qrcode from 'qrcode';
import * as OTPAuth from "otpauth";

@Injectable()
export class AuthService {

  constructor(private readonly jwt: JwtService) {}

  // TODO: rename and typedef argument
  login(user: any) {
    const payload = { sub: user.id };
    return this.jwt.sign(payload)
  }

  async getFortyTwoAccessToken(code: string) {
    try {
      const res = await axios.post('https://api.intra.42.fr/oauth/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: process.env.FT_UID,
          client_secret: process.env.FT_SECRET,
          code: code,
          redirect_uri: `${process.env.COMMON_BASE_URL}:3000/auth/42`
        }
      })
      return res.data.access_token
    } catch (e) {
      return null
    }
  }

  async getFortyTwoUser(access_token: string) {
    const fortytwouser = await axios.get('https://api.intra.42.fr/v2/me', {
      headers : { Authorization: 'Bearer ' + access_token }
    })
    return fortytwouser.data;
  }

  async validateToken(token: string) {
    return this.jwt.verify(token, {secret:  jwtConstants.secret, ignoreExpiration: true });
  }

  decode(jwt: string) {
    return this.jwt.decode(jwt)
  }

  // Step 1/2 to enable 2FA
  async enable2FA(userId: number) {

    const totp = new OTPAuth.TOTP({
      issuer: 'ft-transcendence',
      label: userId.toString(),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromUTF8(process.env.OTP_SECRET as string) // better to be custom for each client
    })

    return qrcode.toDataURL(totp.toString())
  }

  // Step 2/2 to enable 2FA
  validate2FA(token: string, userId: string) {

    const totp = new OTPAuth.TOTP({
      issuer: 'ft-transcendence',
      label: userId.toString(),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromUTF8(process.env.OTP_SECRET as string) // better to be custom for each client
    })

    // success only if validate returns zero
    return totp.validate({ token }) === 0
  }

}

