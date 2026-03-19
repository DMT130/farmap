export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  district: string;
  rating: number;
  reviewCount: number;
  image: string;
  isOpen: boolean;
  openHours: string;
  phone: string;
  deliveryFee: number;
  deliveryTime: string;
  distance: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  description: string;
  requiresPrescription: boolean;
  image: string;
  prices: { pharmacyId: string; price: number; inStock: boolean }[];
}

export interface CartItem {
  medicine: Medicine;
  pharmacyId: string;
  quantity: number;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export const pharmacies: Pharmacy[] = [
  {
    id: "ph1",
    name: "Farmácia Central de Maputo",
    address: "Av. 25 de Setembro, 1234",
    district: "Baixa",
    rating: 4.8,
    reviewCount: 342,
    image: "https://images.unsplash.com/photo-1750750579397-8e7260cf0fb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjeSUyMHN0b3JlZnJvbnQlMjBhZnJpY2F8ZW58MXx8fHwxNzcyNzE5MzcyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isOpen: true,
    openHours: "07:00 - 22:00",
    phone: "+258 21 123 456",
    deliveryFee: 150,
    deliveryTime: "30-45 min",
    distance: "1.2 km",
  },
  {
    id: "ph2",
    name: "Farmácia Saúde Total",
    address: "Av. Julius Nyerere, 567",
    district: "Sommerschield",
    rating: 4.6,
    reviewCount: 218,
    image: "https://images.unsplash.com/photo-1765031092161-a9ebe556117e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjeSUyMHNoZWx2ZXMlMjBtZWRpY2luZXxlbnwxfHx8fDE3NzI2NzQ4MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isOpen: true,
    openHours: "08:00 - 20:00",
    phone: "+258 21 234 567",
    deliveryFee: 200,
    deliveryTime: "45-60 min",
    distance: "2.8 km",
  },
  {
    id: "ph3",
    name: "Farmácia Moderna",
    address: "Rua da Resistência, 89",
    district: "Polana Cimento",
    rating: 4.4,
    reviewCount: 156,
    image: "https://images.unsplash.com/photo-1576091358783-a212ec293ff3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjaXN0JTIwaGVscGluZyUyMGN1c3RvbWVyfGVufDF8fHx8MTc3MjY0OTgyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isOpen: false,
    openHours: "08:00 - 19:00",
    phone: "+258 21 345 678",
    deliveryFee: 100,
    deliveryTime: "20-30 min",
    distance: "0.8 km",
  },
  {
    id: "ph4",
    name: "Farmácia Popular",
    address: "Av. Eduardo Mondlane, 432",
    district: "Alto Maé",
    rating: 4.2,
    reviewCount: 98,
    image: "https://images.unsplash.com/photo-1767966769495-dbb5e14cab5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwZGVsaXZlcnklMjBzZXJ2aWNlfGVufDF8fHx8MTc3MjcxOTM3M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isOpen: true,
    openHours: "07:30 - 21:00",
    phone: "+258 21 456 789",
    deliveryFee: 120,
    deliveryTime: "35-50 min",
    distance: "1.9 km",
  },
  {
    id: "ph5",
    name: "Farmácia Vida Nova",
    address: "Rua do Bagamoyo, 321",
    district: "Malhangalene",
    rating: 4.5,
    reviewCount: 187,
    image: "https://images.unsplash.com/photo-1684777238927-1134cca28473?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXB1dG8lMjBjaXR5JTIwbW96YW1iaXF1ZXxlbnwxfHx8fDE3NzI3MTkzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isOpen: true,
    openHours: "06:00 - 23:00",
    phone: "+258 21 567 890",
    deliveryFee: 180,
    deliveryTime: "40-55 min",
    distance: "3.1 km",
  },
];

export const medicines: Medicine[] = [
  {
    id: "med1",
    name: "Paracetamol 500mg",
    genericName: "Paracetamol",
    category: "Analgésicos",
    description: "Analgésico e antipirético indicado para dores leves a moderadas e febre. Caixa com 20 comprimidos.",
    requiresPrescription: false,
    image: "https://images.unsplash.com/photo-1646392206581-2527b1cae5cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMHBpbGxzJTIwdGFibGV0c3xlbnwxfHx8fDE3NzI3MTkzNzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    prices: [
      { pharmacyId: "ph1", price: 85, inStock: true },
      { pharmacyId: "ph2", price: 95, inStock: true },
      { pharmacyId: "ph3", price: 80, inStock: true },
      { pharmacyId: "ph4", price: 90, inStock: false },
      { pharmacyId: "ph5", price: 88, inStock: true },
    ],
  },
  {
    id: "med2",
    name: "Ibuprofeno 400mg",
    genericName: "Ibuprofeno",
    category: "Anti-inflamatórios",
    description: "Anti-inflamatório não esteroide para dores, inflamações e febre. Caixa com 20 comprimidos.",
    requiresPrescription: false,
    image: "https://images.unsplash.com/photo-1646392206581-2527b1cae5cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMHBpbGxzJTIwdGFibGV0c3xlbnwxfHx8fDE3NzI3MTkzNzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    prices: [
      { pharmacyId: "ph1", price: 120, inStock: true },
      { pharmacyId: "ph2", price: 135, inStock: true },
      { pharmacyId: "ph3", price: 115, inStock: false },
      { pharmacyId: "ph4", price: 125, inStock: true },
      { pharmacyId: "ph5", price: 130, inStock: true },
    ],
  },
  {
    id: "med3",
    name: "Amoxicilina 500mg",
    genericName: "Amoxicilina",
    category: "Antibióticos",
    description: "Antibiótico de amplo espectro para infecções bacterianas. Caixa com 21 cápsulas. Requer receita médica.",
    requiresPrescription: true,
    image: "https://images.unsplash.com/photo-1646392206581-2527b1cae5cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMHBpbGxzJTIwdGFibGV0c3xlbnwxfHx8fDE3NzI3MTkzNzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    prices: [
      { pharmacyId: "ph1", price: 350, inStock: true },
      { pharmacyId: "ph2", price: 380, inStock: true },
      { pharmacyId: "ph3", price: 340, inStock: true },
      { pharmacyId: "ph4", price: 365, inStock: false },
      { pharmacyId: "ph5", price: 355, inStock: true },
    ],
  },
  {
    id: "med4",
    name: "Omeprazol 20mg",
    genericName: "Omeprazol",
    category: "Gastrointestinal",
    description: "Inibidor de bomba de protões para úlceras gástricas e refluxo. Caixa com 28 cápsulas.",
    requiresPrescription: false,
    image: "https://images.unsplash.com/photo-1646392206581-2527b1cae5cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMHBpbGxzJTIwdGFibGV0c3xlbnwxfHx8fDE3NzI3MTkzNzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    prices: [
      { pharmacyId: "ph1", price: 220, inStock: true },
      { pharmacyId: "ph2", price: 250, inStock: false },
      { pharmacyId: "ph3", price: 210, inStock: true },
      { pharmacyId: "ph4", price: 235, inStock: true },
      { pharmacyId: "ph5", price: 225, inStock: true },
    ],
  },
  {
    id: "med5",
    name: "Losartana 50mg",
    genericName: "Losartana Potássica",
    category: "Cardiovascular",
    description: "Anti-hipertensivo para controle da pressão arterial. Caixa com 30 comprimidos. Requer receita médica.",
    requiresPrescription: true,
    image: "https://images.unsplash.com/photo-1646392206581-2527b1cae5cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMHBpbGxzJTIwdGFibGV0c3xlbnwxfHx8fDE3NzI3MTkzNzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    prices: [
      { pharmacyId: "ph1", price: 450, inStock: true },
      { pharmacyId: "ph2", price: 480, inStock: true },
      { pharmacyId: "ph3", price: 430, inStock: true },
      { pharmacyId: "ph4", price: 460, inStock: true },
      { pharmacyId: "ph5", price: 470, inStock: false },
    ],
  },
  {
    id: "med6",
    name: "Metformina 850mg",
    genericName: "Cloridrato de Metformina",
    category: "Diabetes",
    description: "Antidiabético oral para diabetes tipo 2. Caixa com 30 comprimidos. Requer receita médica.",
    requiresPrescription: true,
    image: "https://images.unsplash.com/photo-1646392206581-2527b1cae5cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMHBpbGxzJTIwdGFibGV0c3xlbnwxfHx8fDE3NzI3MTkzNzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    prices: [
      { pharmacyId: "ph1", price: 280, inStock: true },
      { pharmacyId: "ph2", price: 310, inStock: true },
      { pharmacyId: "ph3", price: 270, inStock: false },
      { pharmacyId: "ph4", price: 295, inStock: true },
      { pharmacyId: "ph5", price: 285, inStock: true },
    ],
  },
  {
    id: "med7",
    name: "Vitamina C 1000mg",
    genericName: "Ácido Ascórbico",
    category: "Vitaminas",
    description: "Suplemento vitamínico para reforço do sistema imunológico. Tubo com 10 comprimidos efervescentes.",
    requiresPrescription: false,
    image: "https://images.unsplash.com/photo-1646392206581-2527b1cae5cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMHBpbGxzJTIwdGFibGV0c3xlbnwxfHx8fDE3NzI3MTkzNzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    prices: [
      { pharmacyId: "ph1", price: 180, inStock: true },
      { pharmacyId: "ph2", price: 195, inStock: true },
      { pharmacyId: "ph3", price: 170, inStock: true },
      { pharmacyId: "ph4", price: 185, inStock: true },
      { pharmacyId: "ph5", price: 190, inStock: true },
    ],
  },
  {
    id: "med8",
    name: "Loratadina 10mg",
    genericName: "Loratadina",
    category: "Antialérgicos",
    description: "Anti-histamínico para rinite alérgica e urticária. Caixa com 12 comprimidos.",
    requiresPrescription: false,
    image: "https://images.unsplash.com/photo-1646392206581-2527b1cae5cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMHBpbGxzJTIwdGFibGV0c3xlbnwxfHx8fDE3NzI3MTkzNzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    prices: [
      { pharmacyId: "ph1", price: 150, inStock: true },
      { pharmacyId: "ph2", price: 165, inStock: false },
      { pharmacyId: "ph3", price: 140, inStock: true },
      { pharmacyId: "ph4", price: 155, inStock: true },
      { pharmacyId: "ph5", price: 148, inStock: true },
    ],
  },
];

export const categories: Category[] = [
  { id: "cat1", name: "Analgésicos", icon: "Pill", count: 45 },
  { id: "cat2", name: "Antibióticos", icon: "Shield", count: 32 },
  { id: "cat3", name: "Anti-inflamatórios", icon: "Flame", count: 28 },
  { id: "cat4", name: "Cardiovascular", icon: "Heart", count: 24 },
  { id: "cat5", name: "Diabetes", icon: "Droplets", count: 18 },
  { id: "cat6", name: "Gastrointestinal", icon: "CircleDot", count: 22 },
  { id: "cat7", name: "Vitaminas", icon: "Sparkles", count: 35 },
  { id: "cat8", name: "Antialérgicos", icon: "Wind", count: 15 },
];

export const insurers = [
  { id: "ins1", name: "EMOSE Seguros", logo: "Shield" },
  { id: "ins2", name: "Global Alliance", logo: "Globe" },
  { id: "ins3", name: "SIM Seguros", logo: "Heart" },
  { id: "ins4", name: "Hollard Moçambique", logo: "Building" },
];

export function formatMZN(value: number): string {
  return `${value.toFixed(0)} MT`;
}
