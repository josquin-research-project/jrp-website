#!/usr/bin/env ruby
# Generate the website's text index from the published scores repository.
require 'json'
require 'open3'
require 'tempfile'

def github_tree(ref, recursive: false)
  url = "https://api.github.com/repos/josquin-research-project/jrp-scores/git/trees/#{ref}"
  url += '?recursive=1' if recursive
  body, status = Open3.capture2('curl', '--fail', '--silent', '--show-error',
                               '--location', '--connect-timeout', '15',
                               '--max-time', '90', url)
  raise "Could not fetch text listing from GitHub" unless status.success?

  result = JSON.parse(body)
  raise 'GitHub returned an incomplete text listing' if result['truncated']
  raise 'GitHub returned an invalid text listing' unless result['tree'].is_a?(Array)

  result['tree']
end

def build_text_index(entries)
  entries.sort_by { |entry| entry.fetch('path') }.each_with_object({}) do |entry, index|
    path = entry.fetch('path')
    next unless entry['type'] == 'blob' && File.extname(path).downcase == '.txt'

    match = /\A([A-Z][a-z]{2}[0-9]{4}[a-z]*)-.+\.txt\z/.match(File.basename(path))
    raise "Invalid text filename: texts/#{path}" unless match
    id = match[1]
    raise "Duplicate text ID #{id}: #{index[id]} and texts/#{path}" if index.key?(id)

    index[id] = "texts/#{path}"
  end
end

if $PROGRAM_NAME == __FILE__
  begin
    directory = github_tree('main').find { |entry| entry['path'] == 'texts' && entry['type'] == 'tree' }
    raise 'The scores repository has no texts directory' unless directory

    index = build_text_index(github_tree(directory.fetch('sha'), recursive: true))
    destination = File.join(__dir__, 'texts.json')
    # Replace the index only after a complete, validated response.
    Tempfile.create(['texts-', '.json'], __dir__) do |file|
      file.write(JSON.pretty_generate(index) + "\n")
      file.close
      File.rename(file.path, destination)
    end
    puts "Indexed #{index.length} work texts in #{destination}"
  rescue StandardError => error
    warn "Text index unchanged: #{error.message}"
    exit 1
  end
end
