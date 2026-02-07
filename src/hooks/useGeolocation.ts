import { useState, useEffect } from 'react';

interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    error: string | null;
    loading: boolean;
    permissionStatus: PermissionState | 'unknown';
}

export const useGeolocation = () => {
    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        error: null,
        loading: true,
        permissionStatus: 'unknown',
    });

    const requestLocation = () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        if (!navigator.geolocation) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Geolocation is not supported by your browser',
            }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    error: null,
                    loading: false,
                    permissionStatus: 'granted',
                });
            },
            (error) => {
                let errorMessage = 'Unknown error';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'User denied the request for Geolocation.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'The request to get user location timed out.';
                        break;
                }
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: errorMessage,
                    permissionStatus: 'denied',
                }));
            }
        );
    };

    useEffect(() => {
        // Check permission status on mount
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setState(prev => ({ ...prev, permissionStatus: result.state }));

                // If granted, fetch location immediately
                if (result.state === 'granted') {
                    requestLocation();
                } else {
                    // If prompt or denied, just stop loading initially so UI can deciding when to ask
                    setState(prev => ({ ...prev, loading: false }));
                }

                result.onchange = () => {
                    setState(prev => ({ ...prev, permissionStatus: result.state }));
                };
            });
        } else {
            // Fallback for browsers that don't support permissions API
            setState(prev => ({ ...prev, loading: false }));
        }
    }, []);

    return { ...state, requestLocation };
};
