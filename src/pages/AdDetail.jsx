import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { adsApi, messagesApi } from '../lib/api';
import { 
  MapPin, Calendar, Eye, MessageCircle, Phone, Mail, 
  Loader2, ArrowLeft, Recycle, CheckCircle, XCircle,
  Box, Wine, Wrench, FileText, Trash2, Package
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_ICONS = {
  cardboard: Box,
  glass: Wine,
  metal: Wrench,
  paper: FileText,
  plastic: Recycle,
  trash: Trash2
};

const AdDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchAd();
  }, [id]);

  const fetchAd = async () => {
    try {
      const data = await adsApi.getById(id);
      setAd(data);
    } catch (error) {
      toast.error('Failed to load ad');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to contact the seller');
      navigate('/auth');
      return;
    }

    if (user?._id === ad?.seller?._id) {
      toast.error('This is your own ad');
      return;
    }

    setContacting(true);
    try {
      const conversation = await messagesApi.getOrCreateConversation(ad._id, ad.seller._id);
      navigate(`/messages/${conversation._id}`);
    } catch (error) {
      toast.error('Failed to start conversation');
    } finally {
      setContacting(false);
    }
  };

  const formatPrice = (price) => {
    if (price?.isFree) return 'Free';
    if (!price?.amount) return 'Contact for price';
    return `₹${price.amount.toLocaleString()}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const CategoryIcon = ad ? CATEGORY_ICONS[ad.category] || Package : Package;

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

  if (!ad) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Ad not found</h1>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="aspect-video bg-muted rounded-xl overflow-hidden">
              {ad.images?.length > 0 ? (
                <img 
                  src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${ad.images[selectedImage]}`}
                  alt={ad.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <CategoryIcon className="w-24 h-24 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {ad.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {ad.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img 
                      src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${img}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Ad Details */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="capitalize">
                      <CategoryIcon className="w-3 h-3 mr-1" />
                      {ad.category}
                    </Badge>
                    {ad.condition && (
                      <Badge variant="outline" className="capitalize">
                        {ad.condition}
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">{ad.title}</h1>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {ad.location?.city}, {ad.location?.state}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Posted {formatDate(ad.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {ad.views} views
                  </span>
                </div>

                <Separator />

                <div>
                  <h2 className="font-semibold mb-2">Description</h2>
                  <p className="text-muted-foreground whitespace-pre-line">{ad.description}</p>
                </div>

                {ad.quantity && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="font-semibold mb-2">Quantity</h2>
                      <p className="text-muted-foreground">{ad.quantity}</p>
                    </div>
                  </>
                )}

                {/* ML Prediction Info */}
                {ad.mlPrediction && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="font-semibold mb-3 flex items-center gap-2">
                        <Recycle className="w-4 h-4 text-primary" />
                        AI Classification
                      </h2>
                      <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          {ad.mlPrediction.recyclability === 'Recyclable' ? (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive" />
                          )}
                          <span className={ad.mlPrediction.recyclability === 'Recyclable' ? 'text-primary' : 'text-destructive'}>
                            {ad.mlPrediction.recyclability}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({(ad.mlPrediction.confidence * 100).toFixed(0)}% confidence)
                          </span>
                        </div>
                        {ad.mlPrediction.suggestedUsage && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Suggested use:</strong> {ad.mlPrediction.suggestedUsage}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Price & Seller */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatPrice(ad.price)}
                </div>
                {ad.price?.negotiable && !ad.price?.isFree && (
                  <p className="text-sm text-muted-foreground mb-4">Price is negotiable</p>
                )}
                
                {user?._id !== ad.seller?._id && (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleContact}
                    disabled={contacting}
                  >
                    {contacting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <MessageCircle className="w-4 h-4 mr-2" />
                    )}
                    Contact Seller
                  </Button>
                )}

                {user?._id === ad.seller?._id && (
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    This is your ad
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Seller Card */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4">Seller Information</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {ad.seller?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{ad.seller?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Member since {formatDate(ad.seller?.createdAt)}
                      </p>
                    </div>
                  </div>

                  {ad.seller?.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{ad.seller.location.city}, {ad.seller.location.state}</span>
                    </div>
                  )}

                  {isAuthenticated && ad.seller?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${ad.seller.phone}`} className="hover:text-primary">
                        {ad.seller.phone}
                      </a>
                    </div>
                  )}

                  {isAuthenticated && ad.seller?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${ad.seller.email}`} className="hover:text-primary">
                        {ad.seller.email}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card className="bg-secondary/30">
              <CardContent className="p-6">
                <h2 className="font-semibold mb-3">Safety Tips</h2>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Meet in a public place</li>
                  <li>• Inspect the item before payment</li>
                  <li>• Don't pay in advance</li>
                  <li>• Report suspicious activity</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdDetail;
