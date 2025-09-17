import { LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export class MyLogger implements LoggerService {
  private logDir = path.resolve(__dirname, '../logs'); // 日志文件夹

  constructor() {
    // 如果日志目录不存在则创建
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeLog(level: string, message: any) {
    const logFile = path.join(this.logDir, `${level}.log`);
    const logMsg = `[${new Date().toISOString()}] [${level}] ${message}\n`;
    try {
      fs.appendFileSync(logFile, logMsg); // 用同步方法
    } catch (err) {
      process.stderr.write(`写日志失败: ${err}\n`);
    }
  }
  // 一般日志
  log(message: any) {
    console.log('[LOG]', message);
    this.writeLog('log', message);
  }
  // 错误日志
  error(message: any, trace?: string) {
    console.error('错误日志输出', message, trace ? `\n${trace}` : '');
    this.writeLog('error', `${message}${trace ? `\n${trace}` : ''}`);
  }
  // 警告日志
  warn(message: any) {
    console.warn('[WARN]', message);
    this.writeLog('warn', message);
  }
  //调试日志
  debug(message: any) {
    console.debug('[DEBUG]', message);
    this.writeLog('debug', message);
  }
  //冗余日志
  verbose(message: any) {
    console.log('[VERBOSE]', message);
    this.writeLog('verbose', message);
  }
}
