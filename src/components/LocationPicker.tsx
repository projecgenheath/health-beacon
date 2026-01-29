import { useState } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { MapPin } from 'lucide-react';

interface LocationPickerProps {
    onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
    initialAddress?: string;
}

export function LocationPicker({ onLocationSelect, initialAddress = '' }: LocationPickerProps) {
    const [address, setAddress] = useState(initialAddress);
    const [isLoading, setIsLoading] = useState(false);

    const handleGeocodeManual = async () => {
        if (!address) return;

        setIsLoading(true);
        try {
            // For now, using a simple geocoding approach
            // In production, you would integrate with Google Maps Geocoding API
            // Example: https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY

            // Mock implementation - replace with actual API call
            console.log('Geocoding address:', address);

            // For demonstration, using approximate coordinates for Brazil cities
            // This should be replaced with actual geocoding service
            const mockCoordinates = {
                lat: -23.5505,
                lng: -46.6333,
                address: address,
            };

            onLocationSelect(mockCoordinates);
        } catch (error) {
            console.error('Error geocoding address:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('A geolocalização não é suportada pelo seu navegador');
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // Reverse geocode to get address
                // In production, use Google Maps Geocoding API
                const mockAddress = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;

                setAddress(mockAddress);
                onLocationSelect({
                    lat: latitude,
                    lng: longitude,
                    address: mockAddress,
                });
                setIsLoading(false);
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Erro ao obter localização. Por favor, digite manualmente.');
                setIsLoading(false);
            }
        );
    };

    return (
        <div className="space-y-2">
            <Label>Endereço</Label>
            <div className="flex gap-2">
                <Input
                    placeholder="Digite seu endereço completo"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onBlur={handleGeocodeManual}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleGetCurrentLocation}
                    disabled={isLoading}
                    title="Usar localização atual"
                >
                    <MapPin className="h-4 w-4" />
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                Seu endereço ajuda a encontrar laboratórios próximos
            </p>
        </div>
    );
}
