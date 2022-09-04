import fs from 'fs';
import { TYPE_KEY, encoderDecoderMap } from './encoderDecoder';

const reviver = (_key: string, value: any) => {
  if (
    value &&
    typeof value === 'object' &&
    value[TYPE_KEY] &&
    value[TYPE_KEY] in encoderDecoderMap
  ) {
    const { decode } = encoderDecoderMap[value[TYPE_KEY]];
    return decode(value);
  }
  return value;
};

export async function loadState(stateFile: string) {
  const jsonStr = await fs.promises.readFile(stateFile, 'utf8');
  const result = JSON.parse(jsonStr, reviver);
  return result;
}
