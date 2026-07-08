import { Link } from "react-router-dom";
import type { ProductListItem } from "../types/api";
import BadgeChips from "./BadgeChips";

type ProductCardProps = ProductListItem;

export default function ProductCard({ p }: { p: ProductCardProps }) {
  const img1 = p.image_url ?? "/assets/demo/placeholder.jpg";
  const img2 = p.image_url_2;
  const hasSecondImage = Boolean(img2);

  return (
    <article className="group overflow-hidden bg-white">
      <Link to={`/producto/${p.slug}`} className="block" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="relative aspect-square overflow-hidden bg-neutral-50">
          <img
            src={img1}
            alt={p.name}
            className={hasSecondImage
              ? "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out group-hover:opacity-0"
              : "absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            }
          />
          {img2 && (
            <img
              src={img2}
              alt=""
              aria-hidden="true"
              fetchPriority="low"
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
            />
          )}

          {'is_out_of_stock' in p && p.is_out_of_stock && (
            <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 text-xs font-bold z-10">
              AGOTADO
            </div>
          )}
          {p.badge_labels && p.badge_labels.length > 0 && (
            <div className="absolute bottom-2 left-2 z-10 scale-75 sm:scale-100 origin-bottom-left">
              <BadgeChips badges={p.badge_labels} size="sm" />
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
