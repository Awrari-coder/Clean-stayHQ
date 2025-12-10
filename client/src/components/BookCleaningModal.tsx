import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useHostProperties, useGetCleaningQuote, useBookCleaning } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles, DollarSign, Home, Calendar } from "lucide-react";

interface BookCleaningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CLEANING_TYPES = [
  { value: "post_checkout", label: "Post-Checkout", description: "Clean after guest leaves" },
  { value: "pre_checkout", label: "Pre-Checkout", description: "Mid-stay refresh before checkout" },
  { value: "round_trip", label: "Round Trip", description: "Both pre and post-checkout cleaning" },
  { value: "on_demand", label: "On-Demand", description: "Immediate cleaning request" },
];

export function BookCleaningModal({ open, onOpenChange }: BookCleaningModalProps) {
  const { data: properties = [] } = useHostProperties();
  const getQuote = useGetCleaningQuote();
  const bookCleaning = useBookCleaning();

  const [formData, setFormData] = useState({
    propertyId: "",
    cleaningType: "post_checkout",
    cleaningDate: "",
    squareFeet: "",
    bedrooms: "",
    bathrooms: "",
    hasPets: false,
    restockRequested: false,
    guestName: "",
    specialInstructions: "",
    hostNotes: "",
  });

  const [quote, setQuote] = useState<{ total: number; breakdown: any } | null>(null);

  const canCalculateQuote = formData.propertyId && formData.squareFeet && formData.bedrooms && formData.bathrooms;

  useEffect(() => {
    if (!canCalculateQuote) {
      setQuote(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      getQuote.mutate({
        propertyId: Number(formData.propertyId),
        squareFeet: Number(formData.squareFeet),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        hasPets: formData.hasPets,
        restockRequested: formData.restockRequested,
        cleaningType: formData.cleaningType,
      }, {
        onSuccess: (data) => setQuote(data),
        onError: () => setQuote(null),
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formData.propertyId, formData.squareFeet, formData.bedrooms, formData.bathrooms, formData.hasPets, formData.restockRequested, formData.cleaningType]);

  const handleSubmit = (autoMarkPaid: boolean) => {
    if (!formData.propertyId || !formData.cleaningDate) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    if (!canCalculateQuote) {
      toast({ title: "Please fill in property size details", variant: "destructive" });
      return;
    }

    const cleaningDate = new Date(formData.cleaningDate);
    const checkIn = new Date(cleaningDate);
    checkIn.setHours(checkIn.getHours() - 4);
    const checkOut = cleaningDate;

    bookCleaning.mutate({
      propertyId: Number(formData.propertyId),
      guestName: formData.guestName || undefined,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      squareFeet: Number(formData.squareFeet),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      hasPets: formData.hasPets,
      restockRequested: formData.restockRequested,
      cleaningType: formData.cleaningType,
      specialInstructions: formData.specialInstructions || undefined,
      hostNotes: formData.hostNotes || undefined,
      autoMarkPaid,
    }, {
      onSuccess: () => {
        toast({ 
          title: autoMarkPaid ? "Cleaning booked successfully!" : "Booking created (pending payment)",
          description: autoMarkPaid 
            ? "Your cleaning has been scheduled and a cleaner will be assigned soon."
            : "Complete payment to finalize your cleaning booking."
        });
        onOpenChange(false);
        resetForm();
      },
      onError: () => {
        toast({ title: "Failed to create booking", variant: "destructive" });
      }
    });
  };

  const resetForm = () => {
    setFormData({
      propertyId: "",
      cleaningType: "post_checkout",
      cleaningDate: "",
      squareFeet: "",
      bedrooms: "",
      bathrooms: "",
      hasPets: false,
      restockRequested: false,
      guestName: "",
      specialInstructions: "",
      hostNotes: "",
    });
    setQuote(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Book a Cleaning
          </DialogTitle>
          <DialogDescription>
            Schedule a cleaning for your property with instant pricing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Property *</Label>
              <Select
                value={formData.propertyId}
                onValueChange={(value) => setFormData(f => ({ ...f, propertyId: value }))}
              >
                <SelectTrigger data-testid="select-property">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((prop: any) => (
                    <SelectItem key={prop.id} value={String(prop.id)}>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        {prop.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cleaning Type *</Label>
              <Select
                value={formData.cleaningType}
                onValueChange={(value) => setFormData(f => ({ ...f, cleaningType: value }))}
              >
                <SelectTrigger data-testid="select-cleaning-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLEANING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <span className="font-medium">{type.label}</span>
                        <span className="text-muted-foreground text-xs ml-2">- {type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Cleaning Date & Time *
            </Label>
            <Input
              type="datetime-local"
              value={formData.cleaningDate}
              onChange={(e) => setFormData(f => ({ ...f, cleaningDate: e.target.value }))}
              data-testid="input-cleaning-date"
            />
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-4">Property Size & Details</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Square Feet *</Label>
                <Input
                  type="number"
                  placeholder="1200"
                  value={formData.squareFeet}
                  onChange={(e) => setFormData(f => ({ ...f, squareFeet: e.target.value }))}
                  data-testid="input-square-feet"
                />
              </div>
              <div className="space-y-2">
                <Label>Bedrooms *</Label>
                <Input
                  type="number"
                  placeholder="2"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData(f => ({ ...f, bedrooms: e.target.value }))}
                  data-testid="input-bedrooms"
                />
              </div>
              <div className="space-y-2">
                <Label>Bathrooms *</Label>
                <Input
                  type="number"
                  placeholder="2"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData(f => ({ ...f, bathrooms: e.target.value }))}
                  data-testid="input-bathrooms"
                />
              </div>
            </div>

            <div className="flex gap-6 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPets"
                  checked={formData.hasPets}
                  onCheckedChange={(checked) => setFormData(f => ({ ...f, hasPets: !!checked }))}
                  data-testid="checkbox-has-pets"
                />
                <Label htmlFor="hasPets" className="cursor-pointer">Pets in the property (+$25)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restockRequested"
                  checked={formData.restockRequested}
                  onCheckedChange={(checked) => setFormData(f => ({ ...f, restockRequested: !!checked }))}
                  data-testid="checkbox-restock"
                />
                <Label htmlFor="restockRequested" className="cursor-pointer">Restock supplies (+$15)</Label>
              </div>
            </div>
          </div>

          {quote && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Cleaning Price</p>
                    <p className="text-3xl font-bold text-primary flex items-center gap-1">
                      <DollarSign className="h-6 w-6" />
                      {quote.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground space-y-1">
                    <p>Base: ${quote.breakdown.baseFromSqft.toFixed(2)}</p>
                    <p>Bedrooms: ${quote.breakdown.bedroomsFee}</p>
                    <p>Bathrooms: ${quote.breakdown.bathroomsFee}</p>
                    {quote.breakdown.petFee > 0 && <p>Pet fee: ${quote.breakdown.petFee}</p>}
                    {quote.breakdown.restockFee > 0 && <p>Restock: ${quote.breakdown.restockFee}</p>}
                    {quote.breakdown.cleaningTypeMultiplier !== 1 && (
                      <p>Type multiplier: x{quote.breakdown.cleaningTypeMultiplier}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Guest Name (optional)</Label>
              <Input
                placeholder="Guest name"
                value={formData.guestName}
                onChange={(e) => setFormData(f => ({ ...f, guestName: e.target.value }))}
                data-testid="input-guest-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Special Instructions (visible to cleaner)</Label>
              <Textarea
                placeholder="Any special instructions for the cleaning team..."
                value={formData.specialInstructions}
                onChange={(e) => setFormData(f => ({ ...f, specialInstructions: e.target.value }))}
                data-testid="input-special-instructions"
              />
            </div>

            <div className="space-y-2">
              <Label>Host Notes (private)</Label>
              <Textarea
                placeholder="Personal notes about this booking..."
                value={formData.hostNotes}
                onChange={(e) => setFormData(f => ({ ...f, hostNotes: e.target.value }))}
                data-testid="input-host-notes"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1"
              onClick={() => handleSubmit(true)}
              disabled={bookCleaning.isPending || !quote}
              data-testid="button-book-and-pay"
            >
              {bookCleaning.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Booking & Mark Paid
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleSubmit(false)}
              disabled={bookCleaning.isPending || !quote}
              data-testid="button-book-pay-later"
            >
              {bookCleaning.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Booking (Pay Later)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
