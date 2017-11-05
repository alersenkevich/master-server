import path from 'path'
import { config } from 'dotenv'


config({
  path: path.join(__dirname, '../../.env'),
})

export const { MONGO_URL, PORT } = process.env