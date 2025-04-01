import 'dotenv/config'

export default {
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  DB_NAME: process.env.DATABASE_NAME,
  MONGODB_URI: process.env.MONGODB_URI ,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ,
  HF_KEY: process.env.hf_key,
  AZURE_KEY: process.env.azure_key,
  OPENROUTER_KEY: process.env.openrouter_key
};