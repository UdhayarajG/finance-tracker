import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const SUPPORTED_CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "MXN",
  "SGD", "HKD", "NZD", "SEK", "NOK", "DKK", "ZAR", "BRL", "RUB", "KRW",
  "THB", "MYR", "PHP", "IDR", "VND", "PKR", "BDT", "LKR", "AED", "SAR"
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$", CAD: "C$",
  CHF: "CHF", CNY: "¥", INR: "₹", MXN: "$", SGD: "S$", HKD: "HK$",
  NZD: "NZ$", SEK: "kr", NOK: "kr", DKK: "kr", ZAR: "R", BRL: "R$",
  RUB: "₽", KRW: "₩", THB: "฿", MYR: "RM", PHP: "₱", IDR: "Rp",
  VND: "₫", PKR: "₨", BDT: "৳", LKR: "Rs", AED: "د.إ", SAR: "﷼"
};

interface CurrencyInputProps {
  label?: string;
  amount: number;
  currency: string;
  onAmountChange: (amount: number) => void;
  onCurrencyChange: (currency: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function CurrencyInput({
  label = "Amount",
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  placeholder = "0.00",
  required = false,
}: CurrencyInputProps) {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-muted-foreground">
            {symbol}
          </span>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder={placeholder}
            value={amount || ""}
            onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
            className="pl-8"
          />
        </div>
        <Select value={currency} onValueChange={onCurrencyChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CURRENCIES.map((curr) => (
              <SelectItem key={curr} value={curr}>
                {curr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
