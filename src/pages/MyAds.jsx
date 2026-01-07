import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { adsApi } from '../lib/api';
import { 
  Plus, Loader2, MapPin, Eye, Edit, Trash2, 
  Package, Box, Wine, Wrench, FileText, Recycle, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

const CATEGORY_ICONS = {
  cardboard: Box,
  glass: Wine,
  metal: Wrench,
  paper: FileText,
  plastic: Recycle,
  trash: Trash2
};

const MyAds = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchMyAds();
  }, [isAuthenticated]);

  const fetchMyAds = async () => {
    try {
      const data = await adsApi.getMyAds();
      setAds(data || []);
    } catch (error) {
      toast.error('Failed to load your ads');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setDeleting(true);
    try {
      await adsApi.delete(deleteId);
      setAds(ads.filter(ad => ad._id !== deleteId));
      toast.success('Ad deleted successfully');
    } catch (error) {
      toast.error('Failed to delete ad');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const formatPrice = (price) => {
    if (price?.isFree) return 'Free';
    if (!price?.amount) return 'Contact for price';
    return `₹${price.amount.toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-primary text-primary-foreground';
      case 'sold': return 'bg-accent text-accent-foreground';
      case 'expired': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getCategoryIcon = (category) => CATEGORY_ICONS[category] || Package;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Ads</h1>
            <p className="text-muted-foreground">Manage your posted listings</p>
          </div>
          <Button asChild>
            <Link to="/post-ad">
              <Plus className="w-4 h-4 mr-2" />
              Post New Ad
            </Link>
          </Button>
        </div>

        {/* Empty State */}
        {ads.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No ads yet</h2>
            <p className="text-muted-foreground mb-6">
              Start selling your recyclable waste today!
            </p>
            <Button asChild>
              <Link to="/post-ad">Post Your First Ad</Link>
            </Button>
          </div>
        )}

        {/* Ads List */}
        {ads.length > 0 && (
          <div className="space-y-4">
            {ads.map(ad => {
              const CategoryIcon = getCategoryIcon(ad.category);
              return (
                <Card key={ad._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Image */}
                      <div className="w-full sm:w-48 h-40 bg-muted flex-shrink-0">
                        {ad.images?.[0] ? (
                          <img 
                            src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${ad.images[0]}`}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <CategoryIcon className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 flex flex-col">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`capitalize text-xs ${getStatusColor(ad.status)}`}>
                                {ad.status}
                              </Badge>
                              <Badge variant="outline" className="capitalize text-xs">
                                {ad.category}
                              </Badge>
                            </div>
                            <Link to={`/ad/${ad._id}`}>
                              <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                                {ad.title}
                              </h3>
                            </Link>
                          </div>
                          <p className="text-lg font-bold text-primary flex-shrink-0">
                            {formatPrice(ad.price)}
                          </p>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {ad.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ad.location?.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {ad.views} views
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              asChild
                            >
                              <Link to={`/ad/${ad._id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setDeleteId(ad._id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Delete Ad
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ad? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyAds;
