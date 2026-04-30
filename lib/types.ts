export type Product = {
  id: string;
  name: string;
  price: number;
  size: string;
  status: string;
  image?: string;
  tags: string[];
  description: string;
};

export type InquiryItem = {
  id: string;
  name: string;
  price: number;
  size: string;
  status: string;
  image?: string;
};
