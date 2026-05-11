export interface Chunk {
  content: string;
  index: number;
}

export interface ITextSplitter {
  split(text: string): Promise<Chunk[]>;
}
