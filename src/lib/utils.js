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

const thousands = ["", "thousand", "million", "billion"];

/**
 * Examples:
 * 1        -> one
 * 25       -> twenty five
 * 100      -> one hundred
 * 1250     -> one thousand two hundred fifty
 * 1.3      -> one point three
 * 12.45    -> twelve point forty five
 * 105.99   -> one hundred five point ninety nine
 */

export function numberToWords(number) {
  if (number === 0) return "zero";

  if (number < 0) {
    return `minus ${numberToWords(Math.abs(number))}`;
  }

  const [integerPart, decimalPart] = number.toString().split(".");

  let words = convertIntegerToWords(parseInt(integerPart, 10));

  // Handle decimal part as full number
  if (decimalPart) {
    const decimalNumber = parseInt(decimalPart, 10);

    words += ` point ${convertIntegerToWords(decimalNumber)}`;
  }

  return words.replace(/\s+/g, " ").trim();
}

function convertIntegerToWords(num) {
  if (num === 0) return "zero";

  let word = "";
  let thousandIndex = 0;

  while (num > 0) {
    if (num % 1000 !== 0) {
      word = `${convertHundreds(
        num % 1000,
      )} ${thousands[thousandIndex]} ${word}`.trim();
    }

    num = Math.floor(num / 1000);
    thousandIndex++;
  }

  return word.replace(/\s+/g, " ").trim();
}

function convertHundreds(num) {
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
