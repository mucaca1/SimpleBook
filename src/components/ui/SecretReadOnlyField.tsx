import { Box, CircularProgress, FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput, Typography, Stack } from "@mui/material";
import { useState, useMemo } from "react";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslation } from "react-i18next";

interface SecretFieldOptions {
    fieldName: string,
    loading: boolean
    secretValue: string,
    canBeShowed?: boolean,
    showCopyButton?: boolean,
    multiline?: boolean,
    blurIntensity?: number,
    wordsPerLine?: number
}

/**
 * Formats a mnemonic string into word groups for better readability
 * @param mnemonic - The mnemonic string to format
 * @param wordsPerLine - Number of words per line (default: 4)
 * @returns Array of word group strings
 */
const formatMnemonic = (mnemonic: string, wordsPerLine: number = 4): string[] => {
    const words = mnemonic.split(' ').filter(word => word.trim() !== '');
    if (words.length === 0) return [mnemonic];

    const lines: string[] = [];
    for (let i = 0; i < words.length; i += wordsPerLine) {
        lines.push(words.slice(i, i + wordsPerLine).join(' '));
    }
    return lines;
};

export function SecretReadOnlyField({
    fieldName,
    loading,
    secretValue,
    canBeShowed = true,
    showCopyButton = true,
    multiline = true,
    blurIntensity = 8,
    wordsPerLine = 4
}: SecretFieldOptions) {
    const [showSecret, setShowSecret] = useState<boolean>(false);
    const { t } = useTranslation();

    // Memoize formatted mnemonic lines
    const mnemonicLines = useMemo(() => {
        if (!multiline || !secretValue) return null;
        return formatMnemonic(secretValue, wordsPerLine);
    }, [secretValue, multiline, wordsPerLine]);

    return (
        <FormControl variant="outlined" fullWidth disabled={loading}>
            <InputLabel htmlFor="secret-context-content">{fieldName}</InputLabel>

            {multiline && showSecret ? (
                // Multiline display when shown
                <Box
                    sx={{
                        mt: 2,
                        mb: 1,
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'action.hover',
                        position: 'relative',
                        minHeight: '56px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Stack
                        direction="column"
                        spacing={0.5}
                        sx={{
                            flex: 1,
                            filter: showSecret ? 'none' : `blur(${blurIntensity}px)`,
                            transition: 'filter 0.3s ease-in-out',
                            userSelect: showSecret ? 'text' : 'none',
                        }}
                    >
                        {mnemonicLines?.map((line, index) => (
                            <Typography
                                key={index}
                                variant="body1"
                                sx={{
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.5px',
                                    lineHeight: 1.8,
                                }}
                            >
                                {line}
                            </Typography>
                        ))}
                    </Stack>

                    {/* Action buttons for multiline mode */}
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        {loading && <CircularProgress size={18} />}
                        {showCopyButton && (
                            <IconButton
                                disabled={loading}
                                onClick={() => navigator.clipboard.writeText(secretValue)}
                                size="small"
                            >
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                        )}
                        {canBeShowed && (
                            <IconButton
                                disabled={loading}
                                onClick={() => setShowSecret(!showSecret)}
                                size="small"
                            >
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                </Box>
            ) : (
                // Single line with blur effect (original style or when hidden)
                <OutlinedInput
                    value={secretValue}
                    id="secret-context-content"
                    type={"text"}
                    disabled={loading}
                    sx={{
                        '& input': {
                            filter: showSecret ? 'none' : `blur(${blurIntensity}px)`,
                            transition: 'filter 0.3s ease-in-out',
                            userSelect: showSecret ? 'text' : 'none',
                        },
                    }}
                    endAdornment={
                        <div>
                            <InputAdornment position="end">
                                {loading && (
                                    <CircularProgress size={18} />
                                )}
                                {showCopyButton && (
                                    <IconButton
                                        disabled={loading}
                                        onClick={() => navigator.clipboard.writeText(secretValue)}
                                    >
                                        <ContentCopyIcon />
                                    </IconButton>
                                )}
                                {canBeShowed && (
                                    <IconButton
                                        disabled={loading}
                                        onClick={() => setShowSecret(!showSecret)}
                                    >
                                        {showSecret ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                    </IconButton>
                                )}
                            </InputAdornment>
                        </div>
                    }
                    label={fieldName}
                />
            )}
        </FormControl>
    );
}
