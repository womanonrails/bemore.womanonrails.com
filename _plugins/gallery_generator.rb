# frozen_string_literal: true

require 'fileutils'
require 'mini_magick'

module Reading
  class Generator < Jekyll::Generator
    def generate(site)
      @site = site
      process_images
    end

    private

    attr_reader :site

    def config
      site.config['gallery']
    end

    def input_images_path
      extensions = config['input']['extensions'] || 'jpg,jpeg,png'
      "#{site.source}/#{config['input']['path']}/*.{#{extensions}}"
    end

    def process_images
      Dir.glob(input_images_path).each do |input_image_path|
        image_name = File.basename(input_image_path)
        image_generator.generate(input_image_path, image_name)
        thumbnail_generator.generate(input_image_path, image_name)
      end
    end

    def image_generator
      @image_generator ||= ImageGenerator.new(site, config['output'])
    end

    def thumbnail_generator
      @thumbnail_generator ||= ThumbnailGenerator.new(site, config['thumbnails'])
    end
  end

  class ImageGenerator
    def initialize(site, config)
      @site = site
      @config = config
      ensure_folder_exist
    end

    def generate(image_path, image_name)
      output_image_path = File.join(output_images_path, image_name)
      return if File.exist?(output_image_path)

      image = MiniMagick::Image.open(image_path)
      add_watermark!(image)
      image.write(output_image_path)
      puts "Image generated: #{image_name}"
    end

    private

    attr_reader :config, :site

    def add_watermark!(image)
      config_watermark = site.config['gallery']['watermark']
      return unless config_watermark['text']

      alpha = (config_watermark['opacity'] || 50).to_f / 100.0
      # _color = config_watermark['color'] || 'white'
      font_size = (config_watermark['font_size'] || 16).to_i

      image.combine_options do |command|
        command.gravity 'South'
        command.pointsize font_size
        command.fill "rgba(255, 255, 255, #{alpha})"
        command.draw "text 0,10 '#{config_watermark['text']}'"
      end
    end

    def ensure_folder_exist
      FileUtils.mkdir_p(output_images_path) unless File.directory?(output_images_path)
    end

    def output_images_path
      @output_images_path ||= "#{site.source}/#{config['path']}"
    end
  end

  class ThumbnailGenerator
    def initialize(site, config)
      @site = site
      @config = config
      ensure_folder_exist
    end

    def generate(image_path, image_name)
      thumbnail_path = File.join(thumbnails_path, image_name)
      return if File.exist?(thumbnail_path)

      image = MiniMagick::Image.open(image_path)
      image.resize(config['size']) if config['size']
      image.write(thumbnail_path)
      puts "Thumbnail generated: #{image_name}"
    end

    private

    attr_reader :config, :site

    def ensure_folder_exist
      FileUtils.mkdir_p(thumbnails_path) unless File.directory?(thumbnails_path)
    end

    def thumbnails_path
      @thumbnails_path ||= "#{site.source}/#{config['path']}"
    end
  end
end
