import burger from "@/assets/burger.jpg.asset.json";
import kebab from "@/assets/kebab.jpg.asset.json";
import chicken from "@/assets/chicken.jpg.asset.json";
import fries from "@/assets/fries.jpg.asset.json";
import frieswedges from "@/assets/frieswedges.jpg.asset.json";
import shawarma from "@/assets/shawarma.jpg.asset.json";
import bhajia from "@/assets/bhajia.jpg.asset.json";
import soda from "@/assets/soda.jpg.asset.json";
import juice from "@/assets/juice.jpg.asset.json";

export type MenuVariant = { id: string; label: string; price: number };

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: "Grills & Burgers" | "Sides & Street" | "Drinks";
  image: string;
  price?: number;
  variants?: MenuVariant[];
  tag?: string;
};

/**
 * Prices ending in 5 include a KSh 5 packing tin (takeaway container).
 * Everything is shown split so customers always see the food price and the tin.
 */
export const PACKING_TIN = 5;

export function splitPrice(total: number) {
  const tin = total % 10 === 5 ? PACKING_TIN : 0;
  return { food: total - tin, tin, total };
}

export const formatKsh = (n: number) =>
  "KSh " + n.toLocaleString("en-KE", { maximumFractionDigits: 0 });

export const MENU: MenuItem[] = [
  {
    id: "smash-burger",
    name: "Blaze Smash Burger",
    description:
      "Double-seared beef patty, molten cheddar, charred onions and our smoky blaze sauce in a toasted brioche bun.",
    category: "Grills & Burgers",
    image: burger.url,
    price: 650,
    tag: "Signature",
  },
  {
    id: "shawarma",
    name: "Chicken Shawarma",
    description:
      "Slow-turned marinated chicken, garlic sauce, pickles and kachumbari rolled in a warm saj wrap.",
    category: "Grills & Burgers",
    image: shawarma.url,
    price: 350,
    tag: "Best seller",
  },
  {
    id: "quarter-chicken",
    name: "Quarter Chicken",
    description:
      "Flame-grilled quarter chicken basted in peri spice, finished over open charcoal.",
    category: "Grills & Burgers",
    image: chicken.url,
    price: 250,
  },
  {
    id: "kebab",
    name: "Beef Kebab",
    description: "Hand-rolled spiced beef kebab, crisp outside, juicy through the middle.",
    category: "Sides & Street",
    image: kebab.url,
    price: 125,
  },
  {
    id: "fries",
    name: "Crispy Fries",
    description: "Thick-cut fries, twice fried, dusted with our house blaze salt.",
    category: "Sides & Street",
    image: fries.url,
    price: 155,
  },
  {
    id: "fries-wedges",
    name: "Fries & Wedges (Half)",
    description: "A half plate split between golden fries and peppered potato wedges.",
    category: "Sides & Street",
    image: frieswedges.url,
    price: 145,
  },
  {
    id: "bhajia-smokie",
    name: "Bhajia Special + Smokie",
    description:
      "Masala potato bhajia with a grilled smokie, tamarind chutney and raw onion relish.",
    category: "Sides & Street",
    image: bhajia.url,
    price: 165,
    tag: "Street favourite",
  },
  {
    id: "soda",
    name: "Ice Cold Soda",
    description: "Chilled bottled soda, served over ice. Pick your size.",
    category: "Drinks",
    image: soda.url,
    variants: [
      { id: "300", label: "300ml", price: 55 },
      { id: "500", label: "500ml", price: 80 },
      { id: "2l", label: "2 Litre", price: 150 },
    ],
  },
  {
    id: "fruit-juice",
    name: "Fresh Fruit Juice",
    description: "Cold-pressed mango, passion and pineapple blended to order.",
    category: "Drinks",
    image: juice.url,
    price: 100,
  },
];

export const CATEGORIES = ["Grills & Burgers", "Sides & Street", "Drinks"] as const;
