# Plugin Template

This is a template for creating built-in plugins for the Enjoy application.

## Structure

This template includes:

- `manifest.json` - Plugin metadata and contributions
- `index.ts` - Main plugin implementation
- `plugin-deps.ts` - Plugin dependencies (required for built-in plugins)
- `README.md` - This documentation file

## Development

To create a new built-in plugin based on this template:

1. Copy this directory to a new directory with your plugin name in `src/plugins/`
2. Update the plugin ID, name, and other information in `manifest.json`
3. Implement your plugin functionality in `index.ts`
4. Add any additional files your plugin needs

## Best Practices

- Keep `plugin-deps.ts` up to date with all the dependencies your plugin uses
- Follow the lifecycle methods (load, activate, deactivate) pattern
- Use proper error handling in all async methods
- Include detailed comments and documentation
- Create a meaningful README.md for your plugin

## Building

Built-in plugins are automatically built as part of the application build process. The Vite configuration detects all plugins in the `src/plugins/` directory and builds them as separate entry points.

## Additional Resources

For more information on plugin development, see the [Plugin System Documentation](../../PLUGINS.md).
