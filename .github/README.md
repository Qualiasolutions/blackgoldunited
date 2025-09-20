# BlackGoldUnited ERP - GitHub Actions CI/CD

This directory contains the GitHub Actions workflow configuration for the BlackGoldUnited ERP system.

## Workflow Overview

The `claude-code-ci.yml` workflow provides comprehensive CI/CD pipeline with the following stages:

### 🔍 Validation Stage
- **Claude Code Validation**: Runs project analysis and context integrity checks
- **Security Audit**: Performs dependency scanning and security validation
- **Build and Test**: Multi-node version testing (Node 18, 20)

### 🏗️ Build Stage
- **TypeScript Compilation**: Type checking and validation
- **Next.js Build**: Production build generation with Turbopack
- **Bundle Analysis**: Bundle size analysis and optimization recommendations

### 🧪 Testing Stage
- **Unit Tests**: Runs test suite (when configured)
- **E2E Tests**: Playwright end-to-end testing (when configured)
- **Linting**: ESLint code quality checks

### 🚀 Deployment Stage
- **Staging Deployment**: Automated staging environment deployment
- **Smoke Tests**: Post-deployment validation
- **Production Deployment**: Production environment deployment (main branch only)

### 🔒 Security Features
- **CodeQL Analysis**: Static application security testing
- **Dependency Scanning**: npm audit for vulnerability detection
- **Security Gate**: Custom security validation scripts

## Triggers

The workflow runs on:
- **Push** to `main` or `develop` branches
- **Pull Requests** to `main` branch
- **Schedule**: Daily health checks at 2 AM UTC
- **Manual Dispatch**: On-demand runs with environment selection

## Environment Variables

The workflow uses the following environment variables:
- `NODE_VERSION`: Node.js version (default: 20)
- `PYTHON_VERSION`: Python version for scripts (default: 3.11)
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
- `NODE_ENV`: Set to 'ci' for CI environment
- `CI`: Set to true for CI detection

## Required Secrets

For full functionality, configure these repository secrets:
- `VERCEL_TOKEN`: For Vercel deployments (optional)
- `NETLIFY_AUTH_TOKEN`: For Netlify deployments (optional)
- `SLACK_WEBHOOK_URL`: For team notifications (optional)

## Automation Scripts

The workflow relies on custom automation scripts in the `/scripts` directory:

### Core Scripts
- `claude-project-analyzer.sh`: Project structure and dependency analysis
- `context-integrity-checker.py`: Claude context validation
- `claude-validation-suite.sh`: Comprehensive project validation
- `security-audit-gate.sh`: Security scanning and validation
- `mcp-health-monitor.sh`: MCP health monitoring

### Script Permissions
All scripts are automatically made executable by the workflow.

## Artifacts

The workflow generates and stores the following artifacts:
- **Validation Reports**: Claude validation and analysis results
- **Security Reports**: Security audit findings and recommendations
- **Build Artifacts**: Compiled application files (.next/, dist/, build/)
- **Test Results**: E2E test results and reports
- **Health Reports**: MCP health monitoring data

## Workflow Features

### Concurrency Control
- Prevents multiple workflows from running simultaneously on the same branch
- Cancels in-progress workflows when new commits are pushed

### Matrix Strategy
- Tests against multiple Node.js versions (18, 20)
- Ensures compatibility across different runtime environments

### Conditional Execution
- Deployment only runs on main branch pushes
- E2E tests can be skipped via workflow dispatch
- Health checks run only on main branch

### Error Handling
- Graceful handling of missing scripts or configurations
- Comprehensive error reporting and artifact collection
- Non-blocking warnings for optional components

## Best Practices

1. **Keep Scripts Updated**: Regularly review and update automation scripts
2. **Monitor Security**: Review security audit reports regularly
3. **Optimize Performance**: Monitor build times and bundle sizes
4. **Environment Parity**: Ensure staging closely matches production
5. **Documentation**: Keep this README updated with configuration changes

## Troubleshooting

### Common Issues

**Build Failures**:
- Check Node.js version compatibility
- Verify all dependencies are properly installed
- Review TypeScript compilation errors

**Security Gate Failures**:
- Update vulnerable dependencies
- Review and address security findings
- Ensure .gitignore includes sensitive files

**Deployment Issues**:
- Verify deployment credentials and secrets
- Check environment-specific configurations
- Review deployment target accessibility

### Debug Mode

To enable debug logging, add these environment variables to your workflow:
```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

## Support

For issues with the CI/CD pipeline:
1. Check the workflow run logs in GitHub Actions
2. Review artifact reports for detailed error information
3. Ensure all required dependencies and configurations are in place
4. Verify repository secrets and permissions are correctly configured