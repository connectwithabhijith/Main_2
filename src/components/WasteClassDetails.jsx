
import { 
  Package, GlassWater, Cog, FileText, Milk, Trash2, Factory, Recycle, Leaf, 
  Sparkles, CheckCircle, XCircle, ListChecks, Globe, ArrowRight, Lightbulb,
  Clock, Repeat, Trophy, TreePine, Droplets, Zap, Wind, MapPin, Scissors,
  Box, ScrollText, Egg, BookOpen, Sofa, Truck, Building, ShoppingBag, Shirt,
  Car, Plane, Info
} from "lucide-react";

const wasteClasses = {
  cardboard: {
    name: "Cardboard",
    icon: Package,
    color: "from-amber-500/20 to-amber-600/10",
    borderColor: "border-amber-500/30",
    iconBg: "bg-amber-500/10",

    recyclable: true,
    grade: "A",
    description: "Corrugated boxes, packaging materials, and cardboard sheets.",
    quickFacts: [
      { text: "Can be recycled up to 7 times", icon: Repeat, highlight: "7x" },
      { text: "Takes only 2 months to decompose", icon: Clock, highlight: "2 months" },
      { text: "Most recycled material in the US", icon: Trophy, highlight: "#1" }
    ],
    industries: ["Packaging Industry", "Paper Mills", "Furniture Manufacturing"],

    uses: ["New cardboard boxes", "Paperboard products", "Egg cartons", "Building insulation"],
    recyclingSteps: [
      { step: "Remove any tape, staples, or plastic packaging", icon: Scissors, tip: "Use warm water to soften adhesive tape", time: "2-3 min" },
      { step: "Flatten all cardboard boxes to save space", icon: Box, tip: "Saves up to 75% storage space in your bin", time: "1 min" },
      { step: "Keep cardboard dry - wet cardboard cannot be recycled", icon: Droplets, tip: "Store indoors if rain is expected", time: "—" },
      { step: "Place in recycling bin or take to local recycling center", icon: Truck, tip: "Check local collection schedules", time: "—" }
    ],
    recyclingJourney: [
      { stage: "Collection", description: "Picked up from your recycling bin", icon: Truck },
      { stage: "Sorting", description: "Separated at material recovery facility", icon: Building },
      { stage: "Processing", description: "Pulped with water, cleaned of ink", icon: Droplets },
      { stage: "Manufacturing", description: "Pressed into new cardboard sheets", icon: Factory },
      { stage: "New Product", description: "Back in stores as new packaging", icon: ShoppingBag }
    ],
    realWorldUses: [
      { product: "Cereal Boxes", category: "Food Packaging", icon: Package, description: "Made from 100% recycled cardboard" },
      { product: "Shoe Boxes", category: "Retail", icon: Box, description: "Recycled cardboard reduces costs" },
      { product: "Paper Towel Rolls", category: "Household", icon: ScrollText, description: "Inner tubes from recycled cardboard" },
      { product: "Egg Cartons", category: "Food Packaging", icon: Egg, description: "Molded from recycled pulp" },
      { product: "Book Covers", category: "Publishing", icon: BookOpen, description: "Hardcovers use recycled board" },
      { product: "Furniture Padding", category: "Manufacturing", icon: Sofa, description: "Protective packaging material" }
    ],
    environmentalStats: [
      { label: "Trees Saved", value: "17", icon: TreePine, unit: "per ton", color: "text-green-600" },
      { label: "Water Saved", value: "7,000", icon: Droplets, unit: "gallons", color: "text-blue-500" },
      { label: "Energy Saved", value: "4,100", icon: Zap, unit: "kWh", color: "text-yellow-500" },
      { label: "CO₂ Reduced", value: "1.5", icon: Wind, unit: "tons", color: "text-emerald-600" }
    ],
    disposalInfo: {
      binType: "Blue recycling bin",
      binColor: "bg-blue-500",
      specialNotes: "Keep dry - wet cardboard should go in compost",
      prepRequired: true
    },
    comparison: {
      decompositionTime: "2 months in landfill",
      recyclingRate: "92% recyclable",
      energySavings: "75% less energy than new production"
    }
  },
  glass: {
    name: "Glass",
    icon: GlassWater,
    color: "from-sky-500/20 to-sky-600/10",
    borderColor: "border-sky-500/30",
    iconBg: "bg-sky-500/10",

    recyclable: true,
    grade: "A+",
    description: "Bottles, jars, and glass containers of all colors.",
    quickFacts: [
      { text: "100% recyclable infinitely", icon: Repeat, highlight: "∞" },
      { text: "Takes 1 million years to decompose", icon: Clock, highlight: "1M years" },
      { text: "One of the oldest recyclable materials", icon: Trophy, highlight: "Ancient" }
    ],
    industries: ["Beverage Industry", "Construction", "Art & Crafts"],

    uses: ["New glass containers", "Fiberglass insulation", "Road construction", "Decorative tiles"],
    recyclingSteps: [
      { step: "Rinse containers to remove food residue", icon: Droplets, tip: "A quick rinse is enough, no need for soap", time: "1 min" },
      { step: "Remove metal lids and caps (recycle separately)", icon: Scissors, tip: "Metal caps go in metal recycling", time: "30 sec" },
      { step: "No need to remove paper labels", icon: ScrollText, tip: "Labels burn off during processing", time: "—" },
      { step: "Sort by color if required by your local facility", icon: Box, tip: "Clear, green, and brown are common categories", time: "1 min" }
    ],
    recyclingJourney: [
      { stage: "Collection", description: "Collected from recycling bins", icon: Truck },
      { stage: "Sorting", description: "Separated by color and type", icon: Building },
      { stage: "Crushing", description: "Broken into small pieces called cullet", icon: Factory },
      { stage: "Melting", description: "Heated to 2,800°F to form molten glass", icon: Zap },
      { stage: "Molding", description: "Shaped into new containers", icon: GlassWater }
    ],
    realWorldUses: [
      { product: "New Bottles", category: "Beverages", icon: GlassWater, description: "Glass recycled infinitely" },
      { product: "Countertops", category: "Home Decor", icon: Box, description: "Crushed glass surfaces" },
      { product: "Road Base", category: "Construction", icon: Truck, description: "Aggregate in roads" },
      { product: "Fiberglass", category: "Insulation", icon: Building, description: "Home insulation material" },
      { product: "Decorative Tiles", category: "Art", icon: Sparkles, description: "Beautiful mosaic tiles" },
      { product: "Sandblasting", category: "Industrial", icon: Factory, description: "Abrasive material" }
    ],
    environmentalStats: [
      { label: "CO₂ Reduced", value: "50%", icon: Wind, unit: "less emissions", color: "text-emerald-600" },
      { label: "Energy Saved", value: "30%", icon: Zap, unit: "per batch", color: "text-yellow-500" },
      { label: "Raw Materials", value: "100%", icon: Globe, unit: "conserved", color: "text-blue-500" },
      { label: "Landfill Space", value: "9%", icon: TreePine, unit: "reduced", color: "text-green-600" }
    ],
    disposalInfo: {
      binType: "Glass recycling bin or container",
      binColor: "bg-green-600",
      specialNotes: "Never put broken glass directly in bin - wrap safely first",
      prepRequired: true
    },
    comparison: {
      decompositionTime: "1 million+ years in landfill",
      recyclingRate: "100% recyclable",
      energySavings: "30% less energy than new production"
    }
  },
  metal: {
    name: "Metal",
    icon: Cog,
    color: "from-slate-400/20 to-slate-500/10",
    borderColor: "border-slate-400/30",
    iconBg: "bg-slate-400/10",
    recyclable: true,
    grade: "A",
 
    description: "Aluminum cans, steel containers, and metal scraps.",
    quickFacts: [
      { text: "Aluminum can be recycled forever", icon: Repeat, highlight: "Forever" },
      { text: "Can be back on shelf in 60 days", icon: Clock, highlight: "60 days" },
      { text: "75% of all aluminum ever made is still in use", icon: Trophy, highlight: "75%" }
    ],
    industries: ["Automotive Industry", "Construction", "Electronics"],

    uses: ["Car parts", "Building materials", "New cans", "Machinery components"],
    recyclingSteps: [
      { step: "Empty and rinse containers", icon: Droplets, tip: "Remove food residue to prevent contamination", time: "1 min" },
      { step: "Crush cans to save space (optional)", icon: Box, tip: "Crushed cans take up 80% less space", time: "30 sec" },
      { step: "Separate aluminum from steel if possible", icon: Cog, tip: "Use a magnet - steel sticks, aluminum doesn't", time: "1 min" },
      { step: "Remove any non-metal attachments", icon: Scissors, tip: "Plastic labels and caps should be removed", time: "1 min" }
    ],
    recyclingJourney: [
      { stage: "Collection", description: "Gathered from recycling points", icon: Truck },
      { stage: "Sorting", description: "Separated by metal type using magnets", icon: Cog },
      { stage: "Shredding", description: "Broken into small pieces", icon: Factory },
      { stage: "Melting", description: "Heated in large furnaces", icon: Zap },
      { stage: "Reforming", description: "Cast into new metal products", icon: Car }
    ],
    realWorldUses: [
      { product: "Beverage Cans", category: "Packaging", icon: Box, description: "Back on shelf in 60 days" },
      { product: "Car Parts", category: "Automotive", icon: Car, description: "Engine and body components" },
      { product: "Aircraft Components", category: "Aerospace", icon: Plane, description: "Maintains full strength" },
      { product: "Appliances", category: "Electronics", icon: Cog, description: "Washing machines, fridges" },
      { product: "Construction Steel", category: "Building", icon: Building, description: "Structural beams" },
      { product: "Bicycle Frames", category: "Transport", icon: Truck, description: "Lightweight and strong" }
    ],
    environmentalStats: [
      { label: "Energy Saved", value: "95%", icon: Zap, unit: "for aluminum", color: "text-yellow-500" },
      { label: "CO₂ Reduced", value: "9", icon: Wind, unit: "tons per ton", color: "text-emerald-600" },
      { label: "Water Saved", value: "40%", icon: Droplets, unit: "less used", color: "text-blue-500" },
      { label: "Landfill Saved", value: "100%", icon: TreePine, unit: "diversion", color: "text-green-600" }
    ],
    disposalInfo: {
      binType: "Metal recycling bin",
      binColor: "bg-gray-500",
      specialNotes: "Aerosol cans should be empty before recycling",
      prepRequired: true
    },
    comparison: {
      decompositionTime: "200-500 years in landfill",
      recyclingRate: "Infinitely recyclable",
      energySavings: "95% less energy than mining new ore"
    }
  },
  paper: {
    name: "Paper",
    icon: FileText,
    color: "from-emerald-500/20 to-emerald-600/10",
    borderColor: "border-emerald-500/30",
    iconBg: "bg-emerald-500/10",

    recyclable: true,
    grade: "A-",

    description: "Newspapers, magazines, office paper, and paper bags.",
    quickFacts: [
      { text: "Can be recycled 5-7 times", icon: Repeat, highlight: "5-7x" },
      { text: "Takes 2-6 weeks to decompose", icon: Clock, highlight: "2-6 weeks" },
      { text: "Most recycled material by weight", icon: Trophy, highlight: "By weight" }
    ],
    industries: ["Publishing", "Packaging", "Hygiene Products"],

    uses: ["Recycled paper", "Tissue products", "Newsprint", "Cardboard boxes"],
    recyclingSteps: [
      { step: "Remove any plastic windows or coatings", icon: Scissors, tip: "Window envelopes need the plastic removed", time: "1 min" },
      { step: "Keep paper clean and dry", icon: Droplets, tip: "Wet or greasy paper cannot be recycled", time: "—" },
      { step: "Shred confidential documents before recycling", icon: FileText, tip: "Shredded paper is still recyclable", time: "2 min" },
      { step: "Bundle newspapers and magazines together", icon: Box, tip: "Keep different paper types separate if possible", time: "1 min" }
    ],
    recyclingJourney: [
      { stage: "Collection", description: "Picked up from recycling bins", icon: Truck },
      { stage: "Sorting", description: "Separated by paper grade", icon: Building },
      { stage: "Pulping", description: "Mixed with water to create slurry", icon: Droplets },
      { stage: "De-inking", description: "Ink and impurities removed", icon: Sparkles },
      { stage: "Pressing", description: "Formed into new paper sheets", icon: FileText }
    ],
    realWorldUses: [
      { product: "Newspapers", category: "Publishing", icon: FileText, description: "40% recycled content" },
      { product: "Toilet Paper", category: "Hygiene", icon: ScrollText, description: "From office paper" },
      { product: "Egg Cartons", category: "Packaging", icon: Egg, description: "Molded paper pulp" },
      { product: "Paper Bags", category: "Retail", icon: ShoppingBag, description: "Shopping bags" },
      { product: "Notebooks", category: "Stationery", icon: BookOpen, description: "Recycled notebooks" },
      { product: "Packaging Material", category: "Shipping", icon: Package, description: "Protective packaging" }
    ],
    environmentalStats: [
      { label: "Trees Saved", value: "17", icon: TreePine, unit: "per ton", color: "text-green-600" },
      { label: "Water Saved", value: "7,000", icon: Droplets, unit: "gallons", color: "text-blue-500" },
      { label: "Oil Saved", value: "380", icon: Zap, unit: "gallons", color: "text-yellow-500" },
      { label: "Landfill Space", value: "3.3", icon: Wind, unit: "cubic yards", color: "text-emerald-600" }
    ],
    disposalInfo: {
      binType: "Paper recycling bin",
      binColor: "bg-blue-500",
      specialNotes: "Avoid recycling paper contaminated with food grease",
      prepRequired: true
    },
    comparison: {
      decompositionTime: "2-6 weeks in landfill",
      recyclingRate: "68% recycled nationally",
      energySavings: "70% less energy than virgin paper"
    }

  },
  plastic: {
    name: "Plastic",
    icon: Milk,
    color: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-500/30",
    iconBg: "bg-blue-500/10",

    recyclable: true,
    grade: "B+",

    description: "Bottles, containers, bags, and plastic packaging.",
    quickFacts: [
      { text: "Only 9% of plastic ever made is recycled", icon: Info, highlight: "9%" },
      { text: "Takes 450+ years to decompose", icon: Clock, highlight: "450+ years" },
      { text: "8 million tons enter oceans yearly", icon: Trophy, highlight: "8M tons" }
    ],
    industries: ["Textile Industry", "Furniture", "Construction"],
    uses: ["Polyester fabric", "Plastic lumber", "Containers", "Playground equipment"]
  },
  trash: {
    name: "Trash",
    icon: Trash2,
    color: "from-rose-500/20 to-rose-600/10",
    borderColor: "border-rose-500/30",
    iconBg: "bg-rose-500/10",
    description: "Non-recyclable waste that requires proper disposal.",
    quickFacts: [
      { text: "Average person generates 4.5 lbs daily", icon: Info, highlight: "4.5 lbs" },
      { text: "Only 34% of waste is recycled in US", icon: Clock, highlight: "34%" },
      { text: "Reducing is better than recycling", icon: Trophy, highlight: "Reduce" }
    ],
    industries: ["Waste Management", "Energy Production"],
    uses: ["Waste-to-energy plants", "Landfill management", "Composting (organic)", "Incineration"]
  }
};

const WasteClassDetails = ({ predictedClass }) => {
  if (!predictedClass) {
    return (
      <div className="mt-8 p-8 bg-card border border-border rounded-xl text-center">
        <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Recycling Information</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Upload an image to see detailed recycling information, environmental impact, and industry uses for the identified waste type.
        </p>
      </div>
    );
  }

  const waste = wasteClasses[predictedClass.toLowerCase()];

  if (!waste) {
    return null;
  }

  const IconComponent = waste.icon;

  return (
    <div className="mt-8">
      <div className={`bg-gradient-to-br ${waste.color} border ${waste.borderColor} rounded-xl p-6 transition-all duration-500 animate-fade-in`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 ${waste.iconBg} rounded-xl`}>
            <IconComponent className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{waste.name}</h3>
            <p className="text-sm text-muted-foreground">Recycling & Industry Information</p>
          </div>
        </div>
        
        <p className="text-muted-foreground mb-6">{waste.description}</p>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Industries Section */}
          <div className="bg-card/50 rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Factory className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Where It's Used</span>
            </div>
            <div className="space-y-2">
              {waste.industries.map((industry) => (
                <div
                  key={industry}
                  className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-sm text-secondary-foreground">{industry}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recycled Into Section */}
          <div className="bg-card/50 rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Recycle className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Recycled Into</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {waste.uses.map((use) => (
                <span
                  key={use}
                  className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full border border-primary/20"
                >
                  {use}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Eco tip */}
        <div className="mt-6 flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <Leaf className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            {predictedClass.toLowerCase() === 'trash' 
              ? "While this item may not be recyclable, consider if any parts can be separated for recycling or if it can be repurposed."
              : `Recycling ${waste.name.toLowerCase()} helps conserve natural resources and reduces landfill waste. Make sure to clean and sort before recycling!`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default WasteClassDetails;