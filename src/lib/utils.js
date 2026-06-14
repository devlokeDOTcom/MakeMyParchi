import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ones = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

const teens = [
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const tens = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

export function numberToWords(number) {
  if (number === 0) return "zero";

  if (number < 0) {
    return `minus ${numberToWords(Math.abs(number))}`;
  }

  const [integerPart, decimalPart] = number.toString().split(".");

  let words = convertIndianNumberToWords(parseInt(integerPart, 10));

  if (decimalPart) {
    const decimalNumber = parseInt(decimalPart, 10);

    if (!isNaN(decimalNumber) && decimalNumber > 0) {
      words += ` point ${convertIndianNumberToWords(decimalNumber)}`;
    }
  }

  return words.replace(/\s+/g, " ").trim();
}

function convertIndianNumberToWords(num) {
  if (num === 0) return "zero";

  let result = "";

  const units = [
    { value: 1000000000000, label: "kharab" },
    { value: 10000000000, label: "arab" },
    { value: 10000000, label: "crore" },
    { value: 100000, label: "lakh" },
    { value: 1000, label: "thousand" },
  ];

  for (const unit of units) {
    if (num >= unit.value) {
      const quotient = Math.floor(num / unit.value);

      result += `${convertBelowThousand(quotient)} ${unit.label} `;

      num %= unit.value;
    }
  }

  if (num > 0) {
    result += convertBelowThousand(num);
  }

  return result.trim();
}

function convertBelowThousand(num) {
  let result = "";

  if (num >= 100) {
    result += `${ones[Math.floor(num / 100)]} hundred `;
    num %= 100;
  }

  if (num >= 10 && num <= 19) {
    result += teens[num - 10];
  } else {
    if (num >= 20) {
      result += `${tens[Math.floor(num / 10)]} `;
      num %= 10;
    }

    result += ones[num];
  }

  return result.trim();
}
