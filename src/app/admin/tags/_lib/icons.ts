import {
  TagIcon,
  FolderIcon,
  SparklesIcon,
  HeartIcon,
  UserGroupIcon,
  BeakerIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  FireIcon,
  GiftIcon,
  StarIcon,
  ShieldCheckIcon,
  ClockIcon,
  CalendarIcon,
  PaintBrushIcon,
  SwatchIcon,
  CubeIcon,
  GlobeAltIcon,
  LightBulbIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  HandRaisedIcon,
  FaceSmileIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import type { HeroIcon } from './types'

/** Mapping nom → composant Heroicon, utilisé pour le rendu des cards type. */
export const iconMap: Record<string, HeroIcon> = {
  TagIcon,
  FolderIcon,
  SparklesIcon,
  HeartIcon,
  UserGroupIcon,
  BeakerIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  FireIcon,
  GiftIcon,
  StarIcon,
  ShieldCheckIcon,
  ClockIcon,
  CalendarIcon,
  PaintBrushIcon,
  SwatchIcon,
  CubeIcon,
  GlobeAltIcon,
  LightBulbIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  HandRaisedIcon,
  FaceSmileIcon,
  AcademicCapIcon,
}

/** Liste affichée dans l'IconPicker (ordre = ordre d'affichage). */
export const iconOptions: { value: string; label: string; icon: HeroIcon }[] = [
  { value: 'FolderIcon', label: 'Dossier', icon: FolderIcon },
  { value: 'TagIcon', label: 'Tag', icon: TagIcon },
  { value: 'HeartIcon', label: 'Cœur', icon: HeartIcon },
  { value: 'UserGroupIcon', label: 'Utilisateurs', icon: UserGroupIcon },
  { value: 'BeakerIcon', label: 'Bécher', icon: BeakerIcon },
  { value: 'SparklesIcon', label: 'Étoiles', icon: SparklesIcon },
  { value: 'SunIcon', label: 'Soleil', icon: SunIcon },
  { value: 'MoonIcon', label: 'Lune', icon: MoonIcon },
  { value: 'FireIcon', label: 'Feu', icon: FireIcon },
  { value: 'GiftIcon', label: 'Cadeau', icon: GiftIcon },
  { value: 'StarIcon', label: 'Étoile', icon: StarIcon },
  { value: 'ShieldCheckIcon', label: 'Bouclier', icon: ShieldCheckIcon },
  { value: 'ClockIcon', label: 'Horloge', icon: ClockIcon },
  { value: 'CalendarIcon', label: 'Calendrier', icon: CalendarIcon },
  { value: 'PaintBrushIcon', label: 'Pinceau', icon: PaintBrushIcon },
  { value: 'SwatchIcon', label: 'Palette', icon: SwatchIcon },
  { value: 'CubeIcon', label: 'Cube', icon: CubeIcon },
  { value: 'GlobeAltIcon', label: 'Globe', icon: GlobeAltIcon },
  { value: 'LightBulbIcon', label: 'Ampoule', icon: LightBulbIcon },
  { value: 'BoltIcon', label: 'Éclair', icon: BoltIcon },
  { value: 'MagnifyingGlassIcon', label: 'Loupe', icon: MagnifyingGlassIcon },
  { value: 'EyeIcon', label: 'Œil', icon: EyeIcon },
  { value: 'HandRaisedIcon', label: 'Main', icon: HandRaisedIcon },
  { value: 'FaceSmileIcon', label: 'Sourire', icon: FaceSmileIcon },
  { value: 'AcademicCapIcon', label: 'Diplôme', icon: AcademicCapIcon },
  { value: 'Cog6ToothIcon', label: 'Engrenage', icon: Cog6ToothIcon },
]

/** Palette de couleurs proposée à la création/édition d'un type. */
export const colorOptions: string[] = [
  '#3B82F6', // Bleu
  '#10B981', // Vert
  '#F59E0B', // Orange
  '#EF4444', // Rouge
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange foncé
  '#EC4899', // Rose
  '#6366F1', // Indigo
]

export { generateSlug } from '@/lib/slug'
