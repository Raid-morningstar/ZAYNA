import React from "react";
import Title from "../Title";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

const priceArray = [
  { title: "Moins de 100 MAD", value: "0-100" },
  { title: "100 MAD - 200 MAD", value: "100-200" },
  { title: "200 MAD - 300 MAD", value: "200-300" },
  { title: "300 MAD - 500 MAD", value: "300-500" },
  { title: "Plus de 500 MAD", value: "500-10000" },
];

interface Props {
  selectedPrice?: string | null;
  setSelectedPrice: React.Dispatch<React.SetStateAction<string | null>>;
}
const PriceList = ({ selectedPrice, setSelectedPrice }: Props) => {
  return (
    <div className="w-full bg-white p-5">
      <Title className="text-base font-black">Prix</Title>
      <RadioGroup className="mt-2 space-y-1" value={selectedPrice || ""}>
        {priceArray.map((price, index) => (
          <div
            key={index}
            onClick={() => setSelectedPrice(price.value)}
            className="flex items-center space-x-2 hover:cursor-pointer"
          >
            <RadioGroupItem
              value={price.value}
              id={price.value}
              className="rounded-sm"
            />
            <Label
              htmlFor={price.value}
              className={`${selectedPrice === price.value ? "font-semibold text-shop_dark_green" : "font-normal"}`}
            >
              {price.title}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {selectedPrice && (
        <button
          onClick={() => setSelectedPrice(null)}
          className="text-sm font-medium mt-2 underline underline-offset-2 decoration-1 hover:text-shop_dark_green hoverEffect"
        >
          Reinitialiser la selection
        </button>
      )}
    </div>
  );
};

export default PriceList;
