import { Link } from "react-router-dom";
import type { ProductListItem } from "../types/api";
import BadgeChips from "./BadgeChips";
import OfferRibbon from "./OfferRibbon";
import { useCurrency, formatPrice, getOffer } from "../hooks/useSettings";

type ProductCardProps = ProductListItem;

export default function ProductCard({ p }: { p: ProductCardProps }) {
  const img1 = p.image_url ?? "/assets/demo/placeholder.jpg";
  const img2 = p.image_url_2;
  const hasSecondImage = Boolean(img2);
  const currency = useCurrency();
  const offer = getOffer(p.price, p.sale_price);

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

          {offer && <OfferRibbon label={`-${offer.percent}%`} />}
          {'is_out_of_stock' in p && p.is_out_of_stock && (
            <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 text-xs font-bold z-10">
              AGOTADO
            </div>
          )}
          {p.badge_labels && p.badge_labels.length > 0 && (
            <div className="absolute bottom-2 right-2 z-10 scale-75 sm:scale-100 origin-bottom-right">
              <BadgeChips badges={p.badge_labels} size="sm" />
            </div>
          )}
        </div>
        <div className="pt-3 pb-1 px-2">
          <h3 className="font-display text-xs font-light tracking-widest leading-snug uppercase">{p.name}</h3>
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">{p.category}</p>
          {offer ? (
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-sm font-medium text-[#c4927a]">{formatPrice(offer.salePrice, currency)}</span>
              <span className="text-xs text-neutral-400 line-through">{formatPrice(offer.price, currency)}</span>
            </p>
          ) : p.price != null ? (
            <p className="text-sm font-medium text-neutral-800 mt-1">{formatPrice(p.price, currency)}</p>
          ) : null}
          {p.colors && p.colors.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              {p.colors.slice(0, 5).map((c) => (
                <span
                  key={c.slug}
                  title={c.name}
                  className="inline-block w-2.5 h-2.5 rounded-full border border-black/15"
                  style={
                    c.hex
                      ? { background: c.hex }
                      : { background: 'conic-gradient(red, orange, yellow, green, blue, violet, red)' }
                  }
                />
              ))}
              {p.colors.length > 5 && (
                <span className="text-[9px] text-neutral-400">+{p.colors.length - 5}</span>
              )}
            </div>
          )}
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
