import { useCallback, useRef, useState } from 'react';

interface LongPressOptions {
    threshold?: number;
    onStart?: () => void;
    onFinish?: () => void;
    onCancel?: () => void;
}

export function useLongPress(
    callback: () => void,
    options: LongPressOptions = {}
) {
    const { threshold = 500, onStart, onFinish, onCancel } = options;
    const isLongPress = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const start = useCallback(
        (event: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
            if (isLongPress.current) return;
            onStart && onStart();
            isLongPress.current = false;
            timerRef.current = setTimeout(() => {
                isLongPress.current = true;
                callback();
            }, threshold);
        },
        [callback, threshold, onStart]
    );

    const stop = useCallback(
        (event: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            if (isLongPress.current) {
                onFinish && onFinish();
            } else {
                onCancel && onCancel();
            }
            isLongPress.current = false;
        },
        [onFinish, onCancel]
    );

    return {
        onMouseDown: start,
        onMouseUp: stop,
        onMouseLeave: stop,
        onTouchStart: start,
        onTouchEnd: stop,
    };
}
