import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import * as api from '../../../services/api';
import FormInput from '../../../components/admin/ui/FormInput';
import FormTextarea from '../../../components/admin/ui/FormTextarea';
import FormSelect from '../../../components/admin/ui/FormSelect';
import ImageUpload from '../../../components/admin/ui/ImageUpload';
import { BADGE_MAP } from '../../../components/BadgeChips';

const toSlug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const BADGE_OPTIONS = Object.entries(BADGE_MAP).map(([key, val]) => ({
  key,
  label: [val.line1, val.line2].filter(Boolean).join(' '),
}));

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  slug: z.string().min(1, 'El slug es requerido').max(200).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  description: z.string().optional(),
  category_id: z.number({ message: 'La categoría es requerida' }),
  audience_id: z.number().nullable().optional(),
  thickness_id: z.number().nullable().optional(),
  featured: z.boolean().optional(),
  stock: z.number().min(0, 'El stock no puede ser negativo').optional(),
  low_stock_threshold: z.number().min(0, 'El umbral no puede ser negativo').optional(),
  wa_template: z.string().optional(),
  material_ids: z.array(z.number()).optional(),
  tag_ids: z.array(z.number()).optional(),
  size_ids: z.array(z.number()).optional(),
  length_ids: z.array(z.number()).optional(),
  color_ids: z.array(z.number()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

type Category = { id: number; name: string };
type Material = { id: number; name: string; name_en?: string; name_short?: string };
type Tag = { id: number; name: string };
type Audience = { id: number; name: string };
type Thickness = { id: number; name: string; level: number };
type Size = { id: number; label: string };
type Length = { id: number; label: string };
type Color = { id: number; name: string; hex?: string | null };

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [thicknesses, setThicknesses] = useState<Thickness[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [lengths, setLengths] = useState<Length[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [images, setImages] = useState<(File | string)[]>([]);
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);
  const [badgeLabels, setBadgeLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [copied, setCopied] = useState(false);

  const slugTouched = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      featured: false,
      stock: 0,
      low_stock_threshold: 5,
      audience_id: null,
      thickness_id: null,
      material_ids: [],
      tag_ids: [],
      size_ids: [],
      length_ids: [],
      color_ids: [],
    },
  });

  const selectedMaterials = watch('material_ids') || [];
  const selectedTags = watch('tag_ids') || [];
  const selectedSizes = watch('size_ids') || [];
  const selectedLengths = watch('length_ids') || [];
  const selectedColors = watch('color_ids') || [];
  const nameValue = useWatch({ control, name: 'name' });

  // Auto-generar slug desde nombre solo al crear
  useEffect(() => {
    if (isEditing) return;
    if (slugTouched.current) return;
    setValue('slug', toSlug(nameValue || ''), { shouldValidate: false });
  }, [nameValue, isEditing, setValue]);

  useEffect(() => {
    loadFormData();
  }, [id]);

  const loadFormData = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
      // Load catálogos: categorías, materiales, tags, públicos, grosores, tallas, largos, colores
      const [
        categoriesRes, materialsRes, tagsRes,
        audiencesRes, thicknessesRes, sizesRes, lengthsRes, colorsRes,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`),
        fetch(`${API_BASE_URL}/materials`),
        fetch(`${API_BASE_URL}/tags`),
        fetch(`${API_BASE_URL}/audiences`),
        fetch(`${API_BASE_URL}/thicknesses`),
        fetch(`${API_BASE_URL}/sizes`),
        fetch(`${API_BASE_URL}/lengths`),
        fetch(`${API_BASE_URL}/colors`),
      ]);

      const [
        categoriesData, materialsData, tagsData,
        audiencesData, thicknessesData, sizesData, lengthsData, colorsData,
      ] = await Promise.all([
        categoriesRes.json(), materialsRes.json(), tagsRes.json(),
        audiencesRes.json(), thicknessesRes.json(), sizesRes.json(), lengthsRes.json(), colorsRes.json(),
      ]);

      if (categoriesData.ok) setCategories(categoriesData.data);
      if (materialsData.ok) setMaterials(materialsData.data);
      if (tagsData.ok) setTags(tagsData.data);
      if (audiencesData.ok) setAudiences(audiencesData.data);
      if (thicknessesData.ok) setThicknesses(thicknessesData.data);
      if (sizesData.ok) setSizes(sizesData.data);
      if (lengthsData.ok) setLengths(lengthsData.data);
      if (colorsData.ok) setColors(colorsData.data);

      // Load product if editing
      if (id) {
        const productRes = await api.getProductById(Number(id));
        if (productRes.ok && productRes.data) {
          const product = productRes.data;
          setValue('name', product.name);
          setValue('slug', product.slug);
          setValue('description', product.description || '');
          setValue('category_id', product.category_id);
          setValue('audience_id', product.audience_id ?? null);
          setValue('thickness_id', product.thickness_id ?? null);
          setValue('featured', product.featured || false);
          setValue('stock', product.stock || 0);
          setValue('low_stock_threshold', product.low_stock_threshold || 5);
          setValue('wa_template', product.wa_template || '');
          setValue('material_ids', product.materials?.map((m: any) => m.id) || []);
          setValue('tag_ids', product.tags?.map((t: any) => t.id) || []);
          setValue('size_ids', product.sizes?.map((s: any) => s.id) || []);
          setValue('length_ids', product.lengths?.map((l: any) => l.id) || []);
          setValue('color_ids', product.colors?.map((c: any) => c.id) || []);
          setBadgeLabels(product.badge_labels || []);
          // Cargar imágenes existentes como URLs
          if (product.images && product.images.length > 0) {
            setImages(product.images.map((img: any) => img.image_url));
          } else {
            setImages([]);
          }
        }
      }
    } catch (error) {
      toast.error('Error al cargar datos del formulario');
    } finally {
      setLoading(false);
    }
  };

  const copyTemplate = async () => {
    const productName = watch('name') || '{nombre}';
    const productSlug = watch('slug') || '{slug}';
    const productUrl = `${window.location.origin}/producto/${productSlug}`;

    const template = `Hola, estoy interesado en ${productName} ${productUrl}`;

    try {
      await navigator.clipboard.writeText(template);
      setValue('wa_template', template);
      setCopied(true);
      toast.success('Plantilla copiada y aplicada');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar plantilla');
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    slugTouched.current = true;
    setValue('slug', toSlug(e.target.value), { shouldValidate: true });
  };

  const handleImagesChange = (newImages: (File | string)[]) => {
    // Detectar qué URLs se eliminaron
    const oldUrls = images.filter((img): img is string => typeof img === 'string');
    const newUrls = newImages.filter((img): img is string => typeof img === 'string');

    const removedUrls = oldUrls.filter(url => !newUrls.includes(url));

    if (removedUrls.length > 0) {
      setDeletedImageUrls(prev => [...prev, ...removedUrls]);
    }

    setImages(newImages);
  };

  /**
   * Construye el FormData común para crear/actualizar producto.
   * Los *_ids siempre se envían (incluso vacíos) para que el backend
   * pueda limpiar relaciones al deseleccionar todo.
   */
  const buildProductFormData = (data: ProductFormData): FormData => {
    const formData = new FormData();

    formData.append('name', data.name);
    formData.append('slug', data.slug);
    formData.append('category_id', data.category_id.toString());
    formData.append('audience_id', data.audience_id != null ? String(data.audience_id) : '');
    formData.append('thickness_id', data.thickness_id != null ? String(data.thickness_id) : '');
    formData.append('featured', (data.featured ?? false) ? 'true' : 'false');
    formData.append('stock', (data.stock ?? 0).toString());
    formData.append('low_stock_threshold', (data.low_stock_threshold ?? 5).toString());

    if (data.description) formData.append('description', data.description);
    if (data.wa_template) formData.append('wa_template', data.wa_template);

    formData.append('material_ids', JSON.stringify(data.material_ids ?? []));
    formData.append('tag_ids', JSON.stringify(data.tag_ids ?? []));
    formData.append('size_ids', JSON.stringify(data.size_ids ?? []));
    formData.append('length_ids', JSON.stringify(data.length_ids ?? []));
    formData.append('color_ids', JSON.stringify(data.color_ids ?? []));
    formData.append('badge_labels', JSON.stringify(badgeLabels));

    return formData;
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('auth_token');

      if (isEditing) {
        const newImages = images.filter((img): img is File => img instanceof File);
        const formData = buildProductFormData(data);

        newImages.forEach((file) => formData.append('images', file));
        if (deletedImageUrls.length > 0) {
          formData.append('deleted_images', JSON.stringify(deletedImageUrls));
        }

        const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const result = await response.json();
        if (!result.ok) {
          throw new Error(result.error || 'Error al actualizar producto');
        }

        setDeletedImageUrls([]);
        toast.success('Producto actualizado');
      } else {
        const formData = buildProductFormData(data);
        images.forEach((image) => {
          if (image instanceof File) formData.append('images', image);
        });

        const response = await fetch(`${API_BASE_URL}/admin/products`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const result = await response.json();
        if (!result.ok) {
          throw new Error(result.error || 'Error al crear producto');
        }

        toast.success('Producto creado');
        navigate('/admin/productos');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    }
  };

  // Toggle genérico para cualquier campo de array de IDs (material_ids, size_ids, ...)
  const toggleId = (
    field: 'material_ids' | 'tag_ids' | 'size_ids' | 'length_ids' | 'color_ids',
    current: number[],
    value: number,
  ) => {
    setValue(
      field,
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );
  };

  const toggleMaterial = (id: number) => toggleId('material_ids', selectedMaterials, id);
  const toggleTag = (id: number) => toggleId('tag_ids', selectedTags, id);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="text-neutral-600 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/productos')}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a productos</span>
        </button>
        <h1 className="text-2xl font-bold text-neutral-900">
          {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Información Básica</h2>

          <FormInput
            label="Nombre del Producto"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Ej: Collar de Oro Minimalista"
            required
          />

          <FormInput
            label="Slug"
            value={watch('slug') || ''}
            onChange={handleSlugChange}
            error={errors.slug?.message}
            helperText="Solo minúsculas, números y guiones. Ej: collar-oro-minimalista"
            placeholder="collar-oro-minimalista"
            required
          />

          <FormTextarea
            label="Descripción"
            {...register('description')}
            error={errors.description?.message}
            placeholder="Descripción detallada del producto"
            rows={4}
          />

          <FormSelect
            label="Categoría"
            {...register('category_id', {
              setValueAs: (v) => v ? Number(v) : undefined
            })}
            error={errors.category_id?.message}
            required
          >
            <option value="">Seleccionar categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </FormSelect>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Público"
              {...register('audience_id', {
                setValueAs: (v) => (v ? Number(v) : null),
              })}
              error={errors.audience_id?.message}
              helperText="Para quién es la pieza"
            >
              <option value="">Sin especificar</option>
              {audiences.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </FormSelect>

            <FormSelect
              label="Grosor"
              {...register('thickness_id', {
                setValueAs: (v) => (v ? Number(v) : null),
              })}
              error={errors.thickness_id?.message}
              helperText="De muy delgado a muy grueso"
            >
              <option value="">Sin especificar</option>
              {thicknesses.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </FormSelect>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="featured"
              {...register('featured')}
              className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-500"
            />
            <label htmlFor="featured" className="text-sm font-medium text-neutral-700">
              Producto destacado (aparece en la página principal)
            </label>
          </div>
        </div>

        {/* Stock Section */}
        <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="text-sm font-semibold text-amber-900">Gestión de Inventario</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Stock Disponible"
              type="number"
              {...register('stock', {
                setValueAs: (v) => v ? Number(v) : 0
              })}
              error={errors.stock?.message}
              placeholder="0"
              min="0"
              required
            />

            <FormInput
              label="Umbral de Stock Bajo"
              type="number"
              {...register('low_stock_threshold', {
                setValueAs: (v) => v ? Number(v) : 5
              })}
              error={errors.low_stock_threshold?.message}
              placeholder="5"
              min="0"
              helperText="Alerta cuando el stock llegue a este nivel"
            />
          </div>

          {/* Indicador visual de stock */}
          {watch('stock') !== undefined && (
            <div className="text-sm">
              {watch('stock') === 0 ? (
                <span className="inline-flex items-center gap-2 text-red-700 font-medium">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  AGOTADO
                </span>
              ) : (watch('stock') ?? 0) <= (watch('low_stock_threshold') ?? 5) ? (
                <span className="inline-flex items-center gap-2 text-amber-700 font-medium">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  Stock bajo ({watch('stock')} unidades)
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-green-700 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Stock disponible ({watch('stock')} unidades)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Images */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Imágenes</h2>
          <ImageUpload images={images} onChange={handleImagesChange} />
        </div>

        {/* Materials */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Materiales</h2>
          <div className="flex flex-wrap gap-2">
            {materials.map((material) => (
              <button
                key={material.id}
                type="button"
                title={material.name}
                onClick={() => toggleMaterial(material.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedMaterials.includes(material.id)
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {material.name}
              </button>
            ))}
          </div>
          {materials.length === 0 && (
            <p className="text-sm text-neutral-500">
              No hay materiales disponibles. Créalos primero en la sección de Materiales.
            </p>
          )}
        </div>

        {/* Tallas */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Tallas <span className="font-normal text-neutral-500 text-sm">(anillos)</span></h2>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleId('size_ids', selectedSizes, s.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedSizes.includes(s.id)
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {sizes.length === 0 && (
            <p className="text-sm text-neutral-500">No hay tallas en el catálogo.</p>
          )}
        </div>

        {/* Largos */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Largos <span className="font-normal text-neutral-500 text-sm">(cadenas / pulseras)</span></h2>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-auto pr-1">
            {lengths.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => toggleId('length_ids', selectedLengths, l.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedLengths.includes(l.id)
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          {lengths.length === 0 && (
            <p className="text-sm text-neutral-500">No hay largos en el catálogo.</p>
          )}
        </div>

        {/* Colores */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Colores</h2>
          <p className="text-xs text-neutral-500">El primero seleccionado se marca como color principal en la tarjeta del catálogo.</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const active = selectedColors.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleId('color_ids', selectedColors, c.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    active
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                  }`}
                >
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                    style={c.hex ? { background: c.hex } : { background: 'conic-gradient(red, orange, yellow, green, blue, violet, red)' }}
                  />
                  {c.name}
                </button>
              );
            })}
          </div>
          {colors.length === 0 && (
            <p className="text-sm text-neutral-500">No hay colores en el catálogo.</p>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Tags / Etiquetas</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
          {tags.length === 0 && (
            <p className="text-sm text-neutral-500">
              No hay tags disponibles. Créalos primero en la sección de Tags.
            </p>
          )}
        </div>

        {/* Badges de calidad */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">Badges de calidad</h2>
          <p className="text-xs text-neutral-500">Se muestran sobre la imagen del producto en el catálogo y detalle.</p>
          <div className="flex flex-wrap gap-2">
            {BADGE_OPTIONS.map(({ key, label }) => {
              const active = badgeLabels.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setBadgeLabels(prev =>
                      active ? prev.filter(b => b !== key) : [...prev, key]
                    )
                  }
                  className={`px-3 py-1.5 text-sm font-medium border transition-colors ${
                    active
                      ? 'border-amber-500 bg-amber-50 text-amber-800'
                      : 'border-neutral-300 bg-white text-neutral-600 hover:border-amber-400 hover:text-amber-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* WhatsApp Template */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">WhatsApp</h2>
          <FormTextarea
            label="Mensaje de WhatsApp personalizado"
            {...register('wa_template')}
            error={errors.wa_template?.message}
            placeholder="Hola, estoy interesado en {nombre}..."
            helperText="Usa {nombre} como variable para el nombre del producto"
            rows={3}
          />

          {/* Template Button */}
          <button
            type="button"
            onClick={copyTemplate}
            className="group inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm hover:shadow-md"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Plantilla copiada</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Usar plantilla predeterminada</span>
              </>
            )}
          </button>
          <p className="text-xs text-neutral-500 mt-1">
            Genera: "Hola, estoy interesado en [Nombre del Producto] [URL del producto]"
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={() => navigate('/admin/productos')}
            className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Producto' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
