const BaseColors = {
    purple: '#6750A4',
    ocean: '#0061A4',
    yellow: '#8C6C0A',
    ruby: '#8C1D18',
};

export const ColorPresets: any = {
    purple: {
        light: {
            primary: '#6750A4',
            onPrimary: '#FFFFFF',
            primaryContainer: '#EADDFF',
            background: '#FFFBFE',
            surface: '#FFFFFF',
            surfaceVariant: '#E7E0EC',
            onSurface: '#1C1B1F',
            onSurfaceVariant: '#49454F',
            outline: '#79747E',
            card: '#F3EDF7',
            accent: '#6750A4',
        },
        dark: {
            primary: '#8B63D4',
            onPrimary: '#FFFFFF',
            primaryContainer: '#4F378B',
            background: '#0D0B0F',
            surface: '#121115',
            surfaceVariant: '#2A282D',
            onSurface: '#E6E1E5',
            onSurfaceVariant: '#CAC4D0',
            outline: '#938F99',
            card: '#18161E',
            accent: '#8B63D4',
        }
    },
    ocean: {
        light: {
            primary: '#0061A4',
            onPrimary: '#FFFFFF',
            primaryContainer: '#D1E4FF',
            background: '#F8FDFF',
            surface: '#F8FDFF',
            surfaceVariant: '#DFE2EB',
            onSurface: '#191C1E',
            onSurfaceVariant: '#43474E',
            outline: '#73777F',
            card: '#EAF5FF',
            accent: '#0061A4',
        },
        dark: {
            primary: '#3482F6',
            onPrimary: '#FFFFFF',
            primaryContainer: '#00497D',
            background: '#0B0D0F',
            surface: '#0F1113',
            surfaceVariant: '#2D3135',
            onSurface: '#E2E2E6',
            onSurfaceVariant: '#C3C7CF',
            outline: '#8D9199',
            card: '#141A21',
            accent: '#3482F6',
        }
    },
    yellow: {
        light: {
            primary: '#775A00',
            onPrimary: '#FFFFFF',
            primaryContainer: '#FFE07F',
            background: '#FFFBFF',
            surface: '#FFFBFF',
            surfaceVariant: '#EAE1D0',
            onSurface: '#1E1B16',
            onSurfaceVariant: '#4B4639',
            outline: '#7C7767',
            card: '#FFF0C6',
            accent: '#775A00',
        },
        dark: {
            primary: '#ECC248',
            onPrimary: '#3E2E00',
            primaryContainer: '#5A4300',
            background: '#1E1B16',
            surface: '#14130E',
            surfaceVariant: '#4B4639',
            onSurface: '#E8E2D9',
            onSurfaceVariant: '#CFC5B4',
            outline: '#989080',
            card: '#242017',
            accent: '#ECC248',
        }
    },
    ruby: {
        light: {
            primary: '#9C413D',
            onPrimary: '#FFFFFF',
            primaryContainer: '#FFDAD6',
            background: '#FFF8F7',
            surface: '#FFF8F7',
            surfaceVariant: '#F5DDDA',
            onSurface: '#201A19',
            onSurfaceVariant: '#534341',
            outline: '#857371',
            card: '#FCEAE8',
            accent: '#9C413D',
        },
        dark: {
            primary: '#FFB4AB',
            onPrimary: '#5F1414',
            primaryContainer: '#7D2A28',
            background: '#201A19',
            surface: '#110D0C',
            surfaceVariant: '#534341',
            onSurface: '#EDE0DE',
            onSurfaceVariant: '#D8C2BF',
            outline: '#A08C8A',
            card: '#2D1F1D',
            accent: '#FFB4AB',
        }
    }
};

export type ThemeType = 'light' | 'dark';
export type ColorThemeType = 'purple' | 'ocean' | 'yellow' | 'ruby';
export const BaseThemeColors = BaseColors;
