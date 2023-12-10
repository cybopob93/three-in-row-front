export interface GameCard {
  logo: string;
  title: string;
  description: string;
  link: string;
  stats: Array<{
    value: string;
    code: string;
  }>;
}
