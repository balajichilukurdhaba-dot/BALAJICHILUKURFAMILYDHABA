export const antdTheme: Record<string, any> = {
  token: {
    colorPrimary: '#1E4D2B', // Brand Orange
    colorBgLayout: '#FFFFFF', // Warm Cream brand canvas tone
    colorBgContainer: '#FFFFFF', // Pure White for components
    colorTextBase: '#2A2A2A', // Charcoal text
    borderRadius: 6, // Crispunified modern micro-borders
    fontFamily: 'var(--font-sans), system-ui, sans-serif',
  },
  components: {
    Button: {
      colorPrimary: '#1E4D2B',
      colorPrimaryHover: '#2D7240',
      colorPrimaryActive: '#14331D',
      borderRadius: 6,
      controlHeight: 38,
      fontWeight: 700,
    },
    Input: {
      colorBgContainer: '#FFFFFF',
      colorBorder: '#F5E6E3',
      borderRadius: 6,
    },
    Table: {
      headerBg: '#1E4D2B', // Sider/Header Chocolate-Charcoal
      headerColor: '#FFFFFF',
      borderRadius: 6,
    },
    Card: {
      borderRadius: 12,
    },
    Menu: {
      itemBg: '#1E4D2B',
      itemSelectedBg: '#1E4D2B',
      itemColor: '#FAF6EE',
      itemSelectedColor: '#FFFFFF',
    }
  }
};

export default antdTheme;
