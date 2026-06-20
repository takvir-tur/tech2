import iphone14pro from "@/assets/iphone14pro.jpg";
import iphone13 from "@/assets/iphone13.jpg";
import macbookair from "@/assets/macbookair.jpg";
import macbookpro from "@/assets/macbookpro.jpg";
import ipadpro from "@/assets/ipadpro.jpg";
import galaxys23 from "@/assets/galaxys23.jpg";
import zfold5 from "@/assets/zfold5.jpg";
import galaxytab from "@/assets/galaxytab.jpg";

export type Condition = "Mint" | "Good" | "Fair";
export type Brand = "Apple" | "Samsung";

export interface Product {
  id: string;
  name: string;
  brand: Brand;
  category: "Phone" | "Laptop" | "Tablet";
  price: number;
  image: string;
  batteryHealth: number; // %
  boughtMonthsAgo: number;
  warrantyMonths: number; // remaining
  boxIncluded: boolean;
  condition: Condition;
  aiSummary: string;
  hot?: boolean;
}

export const products: Product[] = [
  {
    id: "p1",
    name: "iPhone 14 Pro 256GB",
    brand: "Apple",
    category: "Phone",
    price: 749,
    image: iphone14pro,
    batteryHealth: 94,
    boughtMonthsAgo: 8,
    warrantyMonths: 4,
    boxIncluded: true,
    condition: "Mint",
    aiSummary: "Pristine screen, no scratches. Battery near new.",
    hot: true,
  },
  {
    id: "p2",
    name: "MacBook Air M2 13\"",
    brand: "Apple",
    category: "Laptop",
    price: 899,
    image: macbookair,
    batteryHealth: 91,
    boughtMonthsAgo: 12,
    warrantyMonths: 0,
    boxIncluded: true,
    condition: "Mint",
    aiSummary: "Minimal wear. Lid and keyboard look unused.",
    hot: true,
  },
  {
    id: "p3",
    name: "Galaxy S23 Ultra 512GB",
    brand: "Samsung",
    category: "Phone",
    price: 689,
    image: galaxys23,
    batteryHealth: 88,
    boughtMonthsAgo: 10,
    warrantyMonths: 2,
    boxIncluded: false,
    condition: "Good",
    aiSummary: "Light micro-scratches on frame. Screen flawless.",
    hot: true,
  },
  {
    id: "p4",
    name: "iPad Pro 11\" M2",
    brand: "Apple",
    category: "Tablet",
    price: 649,
    image: ipadpro,
    batteryHealth: 96,
    boughtMonthsAgo: 5,
    warrantyMonths: 7,
    boxIncluded: true,
    condition: "Mint",
    aiSummary: "Like-new. Magic Keyboard included, no key shine.",
  },
  {
    id: "p5",
    name: "iPhone 13 128GB",
    brand: "Apple",
    category: "Phone",
    price: 449,
    image: iphone13,
    batteryHealth: 82,
    boughtMonthsAgo: 24,
    warrantyMonths: 0,
    boxIncluded: false,
    condition: "Good",
    aiSummary: "Visible wear on edges. Battery healthy for age.",
  },
  {
    id: "p6",
    name: "Galaxy Z Fold 5",
    brand: "Samsung",
    category: "Phone",
    price: 1099,
    image: zfold5,
    batteryHealth: 97,
    boughtMonthsAgo: 3,
    warrantyMonths: 9,
    boxIncluded: true,
    condition: "Mint",
    aiSummary: "Hinge crease normal. Inner display spotless.",
    hot: true,
  },
  {
    id: "p7",
    name: "MacBook Pro 14\" M3",
    brand: "Apple",
    category: "Laptop",
    price: 1599,
    image: macbookpro,
    batteryHealth: 99,
    boughtMonthsAgo: 2,
    warrantyMonths: 10,
    boxIncluded: true,
    condition: "Mint",
    aiSummary: "Effectively new. AppleCare-eligible.",
  },
  {
    id: "p8",
    name: "Galaxy Tab S9+ 256GB",
    brand: "Samsung",
    category: "Tablet",
    price: 539,
    image: galaxytab,
    batteryHealth: 90,
    boughtMonthsAgo: 7,
    warrantyMonths: 5,
    boxIncluded: true,
    condition: "Good",
    aiSummary: "Faint scuff on back. Display & S Pen perfect.",
  },
  {
    id: "p9",
    name: "iPhone 14 Pro 128GB",
    brand: "Apple",
    category: "Phone",
    price: 679,
    image: iphone14pro,
    batteryHealth: 86,
    boughtMonthsAgo: 14,
    warrantyMonths: 0,
    boxIncluded: false,
    condition: "Fair",
    aiSummary: "Notable scratches on back glass. Fully functional.",
  },
  {
    id: "p10",
    name: "Galaxy S23 128GB",
    brand: "Samsung",
    category: "Phone",
    price: 429,
    image: galaxys23,
    batteryHealth: 93,
    boughtMonthsAgo: 6,
    warrantyMonths: 6,
    boxIncluded: true,
    condition: "Mint",
    aiSummary: "Excellent overall. Screen protector applied since day one.",
  },
];

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
