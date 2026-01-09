import passport from 'passport';
import { Express } from 'express';
import configureGooglePassport from './googleOAuth';
import configuresNaverPassport from './naverOAuth';
import configuresKakaoPassport from './kakaoOAuth';
// import { userDataLocalRepository } from '../../repositoryImpls/localUserRepositoryImpl';
import { PrismaUserRepositoryImpl } from '../../repositoryImpls/prismaUserRepositoryImpl';

// const userRepository = userDataLocalRepository();
const userRepository = new PrismaUserRepositoryImpl();

function initPassport() {
  configureGooglePassport(passport, userRepository);
  configuresNaverPassport(passport, userRepository);
  configuresKakaoPassport(passport, userRepository);
}

export default initPassport;
