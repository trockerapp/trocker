import json
import sys
import os

def main():
    if len(sys.argv) != 3:
        print("Usage: python transform_manifest.py <source_manifest> <dest_manifest>")
        sys.exit(1)

    src_path = sys.argv[1]
    dest_path = sys.argv[2]

    try:
        with open(src_path, 'r') as f:
            data = json.load(f)

        # 1. Modify background section for Firefox
        if 'background' in data and 'service_worker' in data['background']:
            del data['background']['service_worker']
            data['background']['scripts'] = ['service-worker.js']
            # Keeping type: module is fine/required for ES6 imports in background scripts in Firefox

        # 2. Remove 'incognito': 'split' (unsupported in Firefox)
        if 'incognito' in data and data['incognito'] == 'split':
            del data['incognito']

        # 3. Add Gecko specific settings
        data['browser_specific_settings'] = {
            'gecko': {
                'id': 'trocker@trockerapp.com',
                'strict_min_version': '109.0'
            }
        }

        # 4. Remove 'offscreen' permission (not fully supported/needed in the same way, helps avoid warnings)
        if 'permissions' in data and 'offscreen' in data['permissions']:
            data['permissions'].remove('offscreen')

        # Write to destination
        with open(dest_path, 'w') as f:
            json.dump(data, f, indent=4)
            print('Manifest transformation successful.')

    except Exception as e:
        print(f'Error transforming manifest: {e}')
        sys.exit(1)

if __name__ == "__main__":
    main()
