import { Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { ITextSplitter, Chunk } from './splitter.interface';

@Injectable()
export class RecursiveTextSplitter implements ITextSplitter {
  private readonly chunkSize = 500;
  private readonly chunkOverlap = 80;

  async split(text: string): Promise<Chunk[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
      separators: ['\n\n', '\n', ' ', ''],
      lengthFunction: (t: string): number => t.length,
    });

    const splitTexts = await splitter.splitText(text);
    return splitTexts.map((content, index) => ({ content, index }));
  }
}
