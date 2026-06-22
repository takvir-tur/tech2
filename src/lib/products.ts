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
  price: number; // BDT
  image: string;
  batteryHealth: number;
  boughtMonthsAgo: number;
  warrantyMonths: number;
  boxIncluded: boolean;
  condition: Condition;
  aiSummary: string;
  dealScore: number; // 0-100, higher = better deal
  listedDaysAgo: number;
  source: string; // marketplace source
  hot?: boolean;
}

export const products: Product[] = [
  {
    id: "p1",
    name: "iPhone 14 Pro 256GB",
    brand: "Apple",
    category: "Phone",
    price: 92000,
    image: iphone14pro,
    batteryHealth: 94,
    boughtMonthsAgo: 8,
    warrantyMonths: 4,
    boxIncluded: true,
    condition: "Mint",
    aiSummary: "Pristine screen, no scratches. Battery near new.",
    dealScore: 92,
    listedDaysAgo: 1,
    source: "Bikroy",
    hot: true,
  },
  {
    id: "p2",
    name: 'MacBook Air M2 13"',
    brand: "Apple",
    category: "Laptop",
    price: 109000,
    image: macbookair,
    batteryHealth: 91,
    boughtMonthsAgo: 12,
    warrantyMonths: 0,
    boxIncluded: true,
    condition: "Mint",
    aiSummary: "Minimal wear. Lid and keyboard look unused.",
    dealScore: 88,
    listedDaysAgo: 2,
    source: "Daraz",
    hot: true,
  },
  {
    id: "p3",
    name: "Galaxy S23 Ultra 512GB",
    brand: "Samsung",
    category: "Phone",
    price: 82500,
    image: galaxys23,
    batteryHealth: 88,
    boughtMonthsAgo: 10,
    warrantyMonths: 2,
    boxIncluded: false,
    condition: "Good",
    aiSummary: "Light micro-scratches on frame. Screen flawless.",
    dealScore: 85,
    listedDaysAgo: 3,
    source: "Pickaboo",
    hot: true,
  },
  {
    id: "p4",
    name: 'iPad Pro 11" M2',
    brand: "Apple",
    category: "Tablet",
    price: 78000,
    image: ipadpro,
    batteryHealth: 96,
    boughtMonthsAgo: 5,
    warrantyMonths: 7,
    boxIncluded: true,
    condition: "Mint",
    aiSummary: "Like-new. Magic Keyboard included, no key shine.",
    dealScore: 79,
    listedDaysAgo: 5,
    source: "Bikroy",
  },
  {
    id: "p5",
    name: "iPhone 13 128GB",
    brand: "Apple",
    category: "Phone",
    price: 54000,
    image: iphone13,
    batteryHealth: 82,
    boughtMonthsAgo: 24,
    warrantyMonths: 0,
    boxIncluded: false,
    condition: "Good",
    aiSummary: "Visible wear on edges. Battery healthy for age.",
    dealScore: 72,
    listedDaysAgo: 8,
    source: "Facebook MP",
  },
  {
    id: "p6",
    name: "Galaxy Z Fold 5",
    brand: "Samsung",
    category: "Phone",
    price: 132000,
    image: zfold5,
    batteryHealth: 97,
    boughtMonthsAgo: 3,
    warrantyMonths: 9,
    boxIncluded: true,
    condition: "Mint",
    aiSummary: "Hinge crease normal. Inner display spotless.",
    dealScore: 90,
    listedDaysAgo: 1,
    source: "Daraz",
    hot: true,
  },
  {
    id: "p7",
    name: 'MacBook Pro 14" M3',
    brand: "Apple",
    category: "Laptop",
    price: 192000,
    image: macbookpro,
    batteryHealth: 99,
    boughtMonthsAgo: 2,
    warrantyMonths: 10,
    boxIncluded: true,
    condition: "Mint",
    aiSummary: "Effectively new. AppleCare-eligible.",
    dealScore: 81,
    listedDaysAgo: 4,
    source: "Pickaboo",
  },
  {
    id: "p8",
    name: "Galaxy Tab S9+ 256GB",
    brand: "Samsung",
    category: "Tablet",
    price: 64500,
    image: galaxytab,
    batteryHealth: 90,
    boughtMonthsAgo: 7,
    warrantyMonths: 5,
    boxIncluded: true,
    condition: "Good",
    aiSummary: "Faint scuff on back. Display & S Pen perfect.",
    dealScore: 76,
    listedDaysAgo: 6,
    source: "Bikroy",
  },
  {
    id: "p9",
    name: "iPhone 14 Pro 128GB",
    brand: "Apple",
    category: "Phone",
    price: 81000,
    image: iphone14pro,
    batteryHealth: 86,
    boughtMonthsAgo: 14,
    warrantyMonths: 0,
    boxIncluded: false,
    condition: "Fair",
    aiSummary: "Notable scratches on back glass. Fully functional.",
    dealScore: 68,
    listedDaysAgo: 10,
    source: "Facebook MP",
  },
  {
    id: "p10",
    name: "Galaxy S23 128GB",
    brand: "Samsung",
    category: "Phone",
    price: 51500,
    image: galaxys23,
    batteryHealth: 93,
    boughtMonthsAgo: 6,
    warrantyMonths: 6,
    boxIncluded: true,
    condition: "Mint",
    aiSummary: "Excellent overall. Screen protector applied since day one.",
    dealScore: 87,
    listedDaysAgo: 2,
    source: "Daraz",
  },
];

export const formatPrice = (n: number) =>
  "৳ " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
