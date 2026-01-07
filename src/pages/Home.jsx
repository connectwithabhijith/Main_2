import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { adsApi } from '../lib/api';
import { Search, MapPin, Recycle, Package, Loader2, Box, Wine, Wrench, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: Package },
  { id: 'cardboard', name: 'Cardboard', icon: Box },
  { id: 'glass', name: 'Glass', icon: Wine },
  { id: 'metal', name: 'Metal', icon: Wrench },
  { id: 'paper', name: 'Paper', icon: FileText },
  { id: 'plastic', name: 'Plastic', icon: Recycle },
  { id: 'trash', name: 'Trash', icon: Trash2 }
];

const Home = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
    city: '',
    sort: 'newest'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchAds();
  }, [filters.category, filters.sort]);

  const fetchAds = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        sort: filters.sort
      };
      
      if (filters.category && filters.category !== 'all') {
        params.category = filters.category;
      }
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.city) {
        params.city = filters.city;
      }

      const result = await adsApi.getAll(params);
      setAds(result.ads || []);
      setPagination(result.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Failed to fetch ads:', error);
      // Show empty state instead of error for demo
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAds(1);
  };

  const getCategoryIcon = (categoryId) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat?.icon || Package;
  };

  const formatPrice = (price) => {
    if (price?.isFree) return 'Free';
    if (!price?.amount) return 'Contact for price';
    return `₹${price.amount.toLocaleString()}${price.negotiable ? ' (Negotiable)' : ''}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 md:py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Buy & Sell <span className="gradient-text">Recyclable</span> Waste
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Turn your waste into value. Connect with buyers and sellers of recyclable materials in your area.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search for waste materials..."
                  className="pl-10 h-12"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <Input
                placeholder="City"
                className="w-32 h-12"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />
              <Button type="submit" size="lg" className="h-12">
                Search
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="border-b border-border">
        <div className="container py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  variant={filters.category === cat.id ? 'default' : 'outline'}
                  size="sm"
                  className="flex-shrink-0 gap-2"
                  onClick={() => setFilters({ ...filters, category: cat.id })}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {pagination.total} {pagination.total === 1 ? 'listing' : 'listings'} found
          </p>
          <Select 
            value={filters.sort} 
            onValueChange={(value) => setFilters({ ...filters, sort: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && ads.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No listings yet</h2>
            <p className="text-muted-foreground mb-6">
              Be the first to post a recyclable item!
            </p>
            <Button asChild>
              <Link to="/post-ad">Post Your First Ad</Link>
            </Button>
          </div>
        )}

        {/* Ads Grid */}
        {!loading && ads.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ads.map(ad => {
              const CategoryIcon = getCategoryIcon(ad.category);
              return (
                <Link key={ad._id} to={`/ad/${ad._id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    {/* Image */}
                    <div className="aspect-[4/3] bg-muted relative">
                      {ad.images?.[0] ? (
                        <img 
                          src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${ad.images[0]}`}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CategoryIcon className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}
                      <Badge className="absolute top-2 left-2 capitalize">
                        {ad.category}
                      </Badge>
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                        {ad.title}
                      </h3>
                      <p className="text-lg font-bold text-primary mb-2">
                        {formatPrice(ad.price)}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{ad.location?.city}, {ad.location?.state}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => fetchAds(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-muted-foreground">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.pages}
              onClick={() => fetchAds(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
