
import {
    useEffect,
    useRef,
    memo,
    type ReactNode,
    type FC,
    type HTMLAttributes
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
    footer?: ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    headerClassName?: string;
}

// --- Ikon ---

/**
 * Ikon X untuk tombol tutup modal.
 * @param {Object} props - Properti komponen.
 * @param {string} [props.className] - Kelas CSS tambahan.
 * @returns {JSX.Element} Elemen SVG ikon X.
 */
const XIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

// --- Komponen ---

/**
 * Komponen Modal untuk menampilkan konten yang berisi diatas sebuah overlay.
 * @param {ModalProps} props - Properti komponen.
 * @returns {JSX.Element | null} Elemen modal yang dirender atau null jika tidak terbuka.
 * @example
 * <Modal isOpen={true} onClose={() => console.log("Modal closed")} title="Judul Bencana">
 *   <p>Contoh isi modal</p>
 * </Modal>
 */
const Modal: FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    description,
    footer,
    size = "md",
    headerClassName,
    className,
    ...props
}) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Menangani penekanan tombol ESC
    useEffect(() => {
        /**
         * Menangani penekanan tombol keyboard Escape.
         * Saat tombol Escape ditekan, maka modal akan ditutup.
         * @param {KeyboardEvent} event - Event keyboard asli dari browser.
         */
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isOpen && event.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            // Mencegah scroll pada body saat modal terbuka
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            // Mengembalikan scroll pada body
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    
    /**
     * Menangani klik pada overlay (latar belakang).
     * Jika area di luar konten diklik, maka modal akan ditutup.
     * @param {React.MouseEvent} e - Objek event mouse.
     */
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (overlayRef.current === e.target) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        full: "max-w-full m-4 h-[calc(100vh-2rem)]",
    };

    return createPortal(
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
            <div
                ref={contentRef}
                role="dialog"
                aria-modal="true"
                className={cn(
                    "relative w-full overflow-hidden rounded-none bg-white text-neutral-900 shadow-2xl ring-1 ring-neutral-950/5 font-montserrat flex flex-col max-h-[90vh]",
                    "animate-in zoom-in-95 duration-200",
                    sizeClasses[size],
                    className
                )}
                {...props}
            >
                {/* Bagian Header */}
                {(title || description) && (
                    <div className={cn("flex flex-col space-y-1.5 p-6 pb-4 border-b border-neutral-100 shrink-0", headerClassName)}>
                        {title && (
                            typeof title === 'string' ? (
                                <h3 className="font-semibold leading-none tracking-tight text-lg text-neutral-900 dark:text-neutral-50 pr-8">
                                    {title}
                                </h3>
                            ) : (
                                <div className="pr-8">{title}</div>
                            )
                        )}
                        {description && (
                            typeof description === 'string' ? (
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {description}
                                </p>
                            ) : description
                        )}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 rounded-none opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-500 dark:ring-offset-neutral-950 dark:focus:ring-neutral-300 dark:data-[state=open]:bg-neutral-800 dark:data-[state=open]:text-neutral-400"
                        >
                            <XIcon className="h-4 w-4" />
                            <span className="sr-only">Tutup</span>
                        </button>
                    </div>
                )}

                {!title && !description && (
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-500 dark:ring-offset-neutral-950 dark:focus:ring-neutral-300 dark:data-[state=open]:bg-neutral-800 dark:data-[state=open]:text-neutral-400"
                    >
                        <XIcon className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                )}

                {/* Konten - Area yang bisa di-scroll */}
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-2 p-6 pt-4 mt-auto border-t border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/50 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default memo(Modal);
