import { Link } from "react-router-dom";
import type { ProductListItem } from "../types/api";

type ProductCardProps = ProductListItem;

export default function ProductCard({ p }: { p: ProductCardProps }) {
  const img = p.image_url || "/assets/demo/placeholder.jpg";

  return (
    <article className="group overflow-hidden bg-white">
      <Link to={`/producto/${p.slug}`} className="block" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="relative aspect-square overflow-hidden bg-neutral-50">
          <img
            src={img}
            alt={p.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />

          {'is_out_of_stock' in p && p.is_out_of_stock && (
            <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 text-xs font-bold z-10">
              AGOTADO
            </div>
          )}
        </div>
        <div className="pt-3 pb-1">
          <h3 className="font-serif text-base leading-snug">{p.name}</h3>
          <p className="text-xs text-neutral-400 capitalize mt-0.5">{p.category}</p>
          {'stock' in p && p.stock > 0 && p.stock <= 5 && (
            <p className="text-xs text-amber-600 font-medium mt-1">
              ¡Solo quedan {p.stock}!
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
