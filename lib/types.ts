export type Product = {
  id: string;
  name: string;
  price: number;
  size: string;
  status: string;
  description: string;
  tags: string[];
  image: string;
  shopeeUrl?: string;
  category?: string;
};

export type InquiryItem = {
  id: string;
  name: string;
  price: number;
  size: string;
  status: string;
  image: string;
};
