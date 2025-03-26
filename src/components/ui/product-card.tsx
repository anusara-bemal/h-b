"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSafeImageUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useSettings } from "@/context/settings-context";

export type ProductCardProps = {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    salePrice?: number;
    images: string;
    category: {
      id: string;
      name: string;
      slug?: string;
    };
  };
  showButton?: boolean;
};

export function ProductCard({ product, showButton = true }: ProductCardProps) {
  const { formatPrice } = useSettings();
  
  return (
    <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
      <div className="aspect-square w-full relative bg-gray-200">
        {product.images ? (
          <Image
            src={getSafeImageUrl(product.images)}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}
        {product.salePrice && (
          <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-xs font-bold">
            SALE
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="mt-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-foreground">{product.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{product.category.name}</p>
            </div>
            {product.salePrice ? (
              <div className="text-right">
                <p className="text-primary font-medium">{formatPrice(product.salePrice)}</p>
                <p className="text-foreground text-sm line-through">{formatPrice(product.price)}</p>
              </div>
            ) : (
              <p className="font-medium text-foreground">{formatPrice(product.price)}</p>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
          {showButton && (
            <Link href={`/products/${product.id}`}>
              <Button className="w-full mt-4 btn-primary">View Product</Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 