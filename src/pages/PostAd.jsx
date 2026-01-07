import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import WasteClassDetails from '../components/WasteClassDetails';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { mlApi, adsApi } from '../lib/api';
import { Upload, Loader2, CheckCircle, ArrowRight, ArrowLeft, ImagePlus, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'cardboard', name: 'Cardboard' },
  { id: 'glass', name: 'Glass' },
  { id: 'metal', name: 'Metal' },
  { id: 'paper', name: 'Paper' },
  { id: 'plastic', name: 'Plastic' },
  { id: 'trash', name: 'Trash / Non-recyclable' }
];

const CONDITIONS = [
  { id: 'new', name: 'New' },
  { id: 'like-new', name: 'Like New' },
  { id: 'good', name: 'Good' },
  { id: 'fair', name: 'Fair' },
  { id: 'poor', name: 'Poor' }
];

const PostAd = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Image & ML Prediction
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  
  // Step 2: Ad Details
  const [additionalImages, setAdditionalImages] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    suggestedUsage: '',
    quantity: '',
    condition: 'good',
    price: '',
    negotiable: true,
    isFree: false,
    city: '',
    state: ''
  });

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result);
      reader.readAsDataURL(file);
      setPrediction(null);
    }
  };

  const handlePredict = async () => {
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await mlApi.predict(imageFile);
      setPrediction(result.prediction);
      
      // Auto-fill form with prediction
      setFormData(prev => ({
        ...prev,
        category: result.prediction.predictedCategory?.toLowerCase() || '',
        suggestedUsage: result.prediction.suggestedUsage || ''
      }));
      
      toast.success('Image classified successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to classify image. Make sure the ML API is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdditionalImages = (e) => {
    const files = Array.from(e.target.files || []);
    const newPreviews = [];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({
          file,
          preview: e.target?.result
        });
        if (newPreviews.length === files.length) {
          setAdditionalImages(prev => [...prev, ...newPreviews].slice(0, 4));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAdditionalImage = (index) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || !formData.city || !formData.state) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Upload additional images first (if any)
      let imageUrls = [];
      if (additionalImages.length > 0) {
        const files = additionalImages.map(img => img.file);
        const uploadResult = await adsApi.uploadImages(files);
        imageUrls = uploadResult.images;
      }
      
      // Create the ad
      const adData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        images: imageUrls,
        mlPrediction: prediction ? {
          predictedCategory: prediction.predictedCategory,
          confidence: prediction.confidence,
          recyclability: prediction.recyclability,
          suggestedUsage: prediction.suggestedUsage
        } : null,
        quantity: formData.quantity,
        condition: formData.condition,
        price: {
          amount: formData.isFree ? 0 : parseFloat(formData.price) || 0,
          negotiable: formData.negotiable,
          isFree: formData.isFree
        },
        location: {
          city: formData.city,
          state: formData.state
        }
      };
      
      await adsApi.create(adData);
      toast.success('Ad posted successfully!');
      navigate('/my-ads');
    } catch (error) {
      toast.error(error.message || 'Failed to post ad');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="hidden sm:inline font-medium">Classify</span>
            </div>
            <div className="w-12 h-0.5 bg-border" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                2
              </div>
              <span className="hidden sm:inline font-medium">Details</span>
            </div>
          </div>

          {/* Step 1: Image Upload & Classification */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI-Powered Classification
                </CardTitle>
                <CardDescription>
                  Upload an image of your waste item. Our AI will identify its category and suggest recycling options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-4">
                  <Label>Upload Image *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="max-h-64 mx-auto rounded-lg object-contain"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            setPrediction(null);
                          }}
                        >
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Upload className="w-10 h-10" />
                          <span className="font-medium">Click to upload or drag and drop</span>
                          <span className="text-sm">PNG, JPG up to 5MB</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Classify Button */}
                {imagePreview && !prediction && (
                  <Button 
                    onClick={handlePredict} 
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Classify with AI
                      </>
                    )}
                  </Button>
                )}

                {/* Prediction Result - Enhanced WasteClassDetails */}
                {prediction && (
                  <WasteClassDetails 
                    predictedClass={prediction.predictedCategory} 
                    uploadedImage={imagePreview}
                  />
                )}

                {/* Continue Button */}
                {prediction && (
                  <Button 
                    onClick={() => setStep(2)} 
                    className="w-full"
                    size="lg"
                  >
                    Continue to Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {/* Skip Classification */}
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(2)}
                  className="w-full"
                >
                  Skip classification and fill details manually
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Ad Details Form */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStep(1)}
                  className="w-fit -ml-2 mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <CardTitle>Ad Details</CardTitle>
                <CardDescription>
                  Fill in the details about your item. Fields marked with * are required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., 50kg Cardboard Boxes - Clean & Dry"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your item in detail..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Suggested Usage (from ML) */}
                  {formData.suggestedUsage && (
                    <div className="space-y-2">
                      <Label>AI Suggested Usage</Label>
                      <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                        {formData.suggestedUsage}
                      </p>
                    </div>
                  )}

                  {/* Additional Images */}
                  <div className="space-y-2">
                    <Label>Additional Images (up to 4)</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {additionalImages.map((img, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                          <img src={img.preview} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(index)}
                            className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {additionalImages.length < 4 && (
                        <label className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                          <ImagePlus className="w-6 h-6 text-muted-foreground" />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleAdditionalImages}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Condition */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        placeholder="e.g., 50 kg"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Select 
                        value={formData.condition} 
                        onValueChange={(value) => setFormData({ ...formData, condition: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITIONS.map(cond => (
                            <SelectItem key={cond.id} value={cond.id}>{cond.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isFree">Give away for free</Label>
                      <Switch
                        id="isFree"
                        checked={formData.isFree}
                        onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked })}
                      />
                    </div>
                    
                    {!formData.isFree && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Price (₹)</Label>
                          <Input
                            id="price"
                            type="number"
                            placeholder="0"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-8">
                          <Switch
                            id="negotiable"
                            checked={formData.negotiable}
                            onCheckedChange={(checked) => setFormData({ ...formData, negotiable: checked })}
                          />
                          <Label htmlFor="negotiable">Negotiable</Label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        placeholder="Maharashtra"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      'Post Ad'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default PostAd;
